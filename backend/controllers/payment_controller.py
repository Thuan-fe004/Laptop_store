# controllers/payment_controller.py
import hmac
import hashlib
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db

payment_bp = Blueprint('payment', __name__)

# ─── CẤU HÌNH TÀI KHOẢN MB BANK ─────────────────────────
BANK_ID      = "MB"
ACCOUNT_NO   = "0867845804"
ACCOUNT_NAME = "TRAN VAN THUAN"

# ─── SECRET KEY SEPAY ────────────────────────────────────
# Vào sepay.vn → Webhooks → API Key/Secret → dán vào đây
SEPAY_SECRET = "YOUR_SEPAY_WEBHOOK_SECRET"


# ─── HELPER ──────────────────────────────────────────────
def make_transfer_content(order_id: int) -> str:
    """VD: order_id=123 → 'LAPTOP123' — SePay gửi lại chuỗi này trong field 'content'"""
    return f"LAPTOP{order_id}"


def extract_order_id_from_content(content: str):
    """Parse nội dung CK để tìm order_id từ pattern LAPTOP<số>"""
    match = re.search(r'LAPTOP(\d+)', content.upper())
    return int(match.group(1)) if match else None


# ─── GET /api/payment/qr/<order_id> ──────────────────────
@payment_bp.route('/qr/<int:order_id>', methods=['GET'])
@jwt_required()
def get_payment_qr(order_id):
    user_id = int(get_jwt_identity())

    # ✅ FIX: Lấy cả user_id từ DB, so sánh bằng Python thay vì SQL
    # Tránh type mismatch khi JWT identity là string
    row = db.session.execute(db.text("""
        SELECT id, final_price, payment_status, payment_method, user_id
        FROM orders
        WHERE id = :oid
    """), {'oid': order_id}).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đơn hàng'}), 404

    # Kiểm tra ownership bằng Python
    if int(row[4]) != user_id:
        return jsonify({'success': False, 'message': 'Không có quyền truy cập đơn hàng này'}), 403

    if row[2] == 'paid':
        return jsonify({'success': True, 'already_paid': True, 'message': 'Đơn hàng đã được thanh toán'})

    if row[3] != 'transfer':
        return jsonify({'success': False, 'message': 'Đơn hàng này không dùng chuyển khoản'}), 400

    amount      = int(row[1])
    description = make_transfer_content(order_id)

    qr_url = (
        f"https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.png"
        f"?amount={amount}"
        f"&addInfo={description}"
        f"&accountName={ACCOUNT_NAME.replace(' ', '%20')}"
    )

    return jsonify({
        'success':      True,
        'already_paid': False,
        'qr_url':       qr_url,
        'amount':       amount,
        'description':  description,
        'account_no':   ACCOUNT_NO,
        'account_name': ACCOUNT_NAME,
        'bank':         'MB Bank',
        'bank_id':      BANK_ID,
    })


# ─── GET /api/payment/status/<order_id> ──────────────────
# Frontend polling mỗi 5 giây để kiểm tra đã thanh toán chưa
@payment_bp.route('/status/<int:order_id>', methods=['GET'])
@jwt_required()
def check_payment_status(order_id):
    user_id = int(get_jwt_identity())

    # ✅ FIX: Tương tự — lấy user_id ra so sánh bằng Python
    row = db.session.execute(db.text("""
        SELECT payment_status, user_id FROM orders
        WHERE id = :oid
    """), {'oid': order_id}).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đơn hàng'}), 404

    if int(row[1]) != user_id:
        return jsonify({'success': False, 'message': 'Không có quyền truy cập'}), 403

    return jsonify({
        'success':        True,
        'order_id':       order_id,
        'payment_status': row[0],   # 'unpaid' | 'paid'
    })


# ─── POST /api/payment/webhook ───────────────────────────
# SePay gọi endpoint này mỗi khi có tiền vào tài khoản MB Bank
# Không cần JWT — SePay xác thực bằng chữ ký HMAC-SHA256
@payment_bp.route('/webhook', methods=['POST'])
def sepay_webhook():
    # ── Bước 1: Xác thực chữ ký từ SePay ────────────────
    if SEPAY_SECRET and SEPAY_SECRET != "YOUR_SEPAY_WEBHOOK_SECRET":
        signature = request.headers.get('X-Webhook-Signature', '')
        raw_body  = request.get_data()  # bytes, không decode

        # ✅ FIX: dùng hmac.new() đúng cách với bytes
        expected = hmac.new(
            SEPAY_SECRET.encode('utf-8'),
            raw_body,                   # bytes trực tiếp, không encode lại
            digestmod=hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected):
            return jsonify({'success': False, 'message': 'Invalid signature'}), 401

    # ── Bước 2: Đọc dữ liệu SePay gửi về ────────────────
    data = request.get_json(force=True, silent=True) or {}

    amount  = data.get('transferAmount') or data.get('amount', 0)
    content = data.get('content', '')

    # ── Bước 3: Tìm order_id từ nội dung chuyển khoản ───
    order_id = extract_order_id_from_content(content)

    if not order_id:
        # Không phải giao dịch của shop → trả 200 để SePay không retry
        return jsonify({'success': True, 'message': 'Không tìm thấy đơn hàng phù hợp'}), 200

    # ── Bước 4: Kiểm tra đơn hàng và số tiền ────────────
    row = db.session.execute(db.text("""
        SELECT id, final_price, payment_status FROM orders
        WHERE id = :oid
    """), {'oid': order_id}).fetchone()

    if not row:
        return jsonify({'success': True, 'message': 'Order không tồn tại'}), 200

    if row[2] == 'paid':
        # Idempotent — đã xử lý rồi
        return jsonify({'success': True, 'message': 'Đã xử lý trước đó'}), 200

    required_amount = int(row[1])
    paid_amount     = int(amount)

    if paid_amount < required_amount:
        print(f"[PAYMENT] Order #{order_id}: cần {required_amount:,}đ, nhận {paid_amount:,}đ — BỎ QUA")
        return jsonify({'success': True, 'message': 'Số tiền không khớp'}), 200

    # ── Bước 5: Cập nhật trạng thái — tự động xác nhận ──
    try:
        db.session.execute(db.text("""
            UPDATE orders
            SET payment_status = 'paid',
                status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END
            WHERE id = :oid
        """), {'oid': order_id})
        db.session.commit()

        print(f"[PAYMENT] ✅ Order #{order_id} thanh toán thành công ({paid_amount:,}đ)")

        # Frontend đang polling /api/payment/status/{order_id} mỗi 5s
        # Khi thấy payment_status='paid' → tự động đóng QR modal → hiện Bill
        return jsonify({'success': True, 'message': f'Xác nhận thanh toán đơn #{order_id} thành công'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[PAYMENT] ❌ Lỗi cập nhật order #{order_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500