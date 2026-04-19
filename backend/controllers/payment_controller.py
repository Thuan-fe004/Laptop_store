# controllers/payment_controller.py
import hmac
import hashlib
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db

payment_bp = Blueprint('payment', __name__)

# ─── CẤU HÌNH SEPAY PAYMENT GATEWAY ─────────────────────
SEPAY_MERCHANT_ID  = "SP-LIVE-TV245266"

# Lấy từ tab "Thông tin đơn vị"
SEPAY_SECRET_KEY   = "spsk_live_AAwqcEFmEtPoYJ37xKbYAi2Afs8Ukgqk"  # ← điền đầy đủ

# Bạn tự đặt trong tab "IPN"
SEPAY_IPN_SECRET   = "Thuan2004@"   # ← điền đầy đủ

# URL Production của SePay PG (đúng)
SEPAY_CHECKOUT_URL = "https://pgapi.sepay.vn/v1/checkout/init"

# ─── URL frontend để redirect sau thanh toán ─────────────
FRONTEND_URL = "https://laptopstore-ten.vercel.app"


def generate_signature(data: dict, secret_key: str) -> str:
    """Tạo chữ ký HMAC-SHA256 theo chuẩn SePay PG"""
    filtered = {k: v for k, v in data.items() if v is not None and v != '' and k != 'signature'}
    sorted_keys = sorted(filtered.keys())
    query_string = '&'.join(f"{k}={filtered[k]}" for k in sorted_keys)
    return hmac.new(
        secret_key.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def verify_ipn_signature(data: dict, secret_key: str) -> bool:
    """Xác thực chữ ký IPN từ SePay"""
    received_signature = data.get('signature', '')
    expected_signature = generate_signature(data, secret_key)
    return hmac.compare_digest(received_signature, expected_signature)


# ─── POST /api/payment/create/<order_id> ─────────────────
# Frontend gọi sau khi đặt hàng → nhận checkout_url → redirect sang SePay
@payment_bp.route('/create/<int:order_id>', methods=['POST'])
@jwt_required()
def create_payment(order_id):
    user_id = int(get_jwt_identity())

    row = db.session.execute(db.text("""
        SELECT id, order_code, final_price, payment_status, payment_method, user_id
        FROM orders WHERE id = :oid
    """), {'oid': order_id}).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đơn hàng'}), 404
    if int(row[5]) != user_id:
        return jsonify({'success': False, 'message': 'Không có quyền truy cập'}), 403
    if row[3] == 'paid':
        return jsonify({'success': True, 'already_paid': True})
    if row[4] != 'transfer':
        return jsonify({'success': False, 'message': 'Đơn hàng không dùng chuyển khoản'}), 400

    order_code  = row[1]
    final_price = int(row[2])

    # Tạo form fields theo chuẩn SePay PG
    form_data = {
        'merchant_id':          SEPAY_MERCHANT_ID,
        'order_invoice_number': order_code,
        'order_amount':         final_price,
        'order_currency':       'VND',
        'order_description':    f'Thanh toan don hang {order_code}',
        'operation':            'PURCHASE',
        'success_url':          f'{FRONTEND_URL}/orders?payment=success&order_id={order_id}',
        'error_url':            f'{FRONTEND_URL}/orders?payment=error&order_id={order_id}',
        'cancel_url':           f'{FRONTEND_URL}/checkout?payment=cancel',
    }

    # Tạo chữ ký
    form_data['signature'] = generate_signature(form_data, SEPAY_SECRET_KEY)

    print(f"[SEPAY] Form fields tạo xong cho đơn {order_code}")

    # Trả về frontend để tự POST form lên SePay
    return jsonify({
        'success':    True,
        'use_form':   True,
        'action_url': SEPAY_CHECKOUT_URL,
        'form_fields': form_data,
        'order_code': order_code,
    })



# ─── GET /api/payment/status/<order_id> ──────────────────
# Frontend polling mỗi 3 giây để check đã paid chưa
@payment_bp.route('/status/<int:order_id>', methods=['GET'])
@jwt_required()
def check_payment_status(order_id):
    user_id = int(get_jwt_identity())

    row = db.session.execute(db.text("""
        SELECT payment_status, user_id FROM orders WHERE id = :oid
    """), {'oid': order_id}).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đơn hàng'}), 404
    if int(row[1]) != user_id:
        return jsonify({'success': False, 'message': 'Không có quyền truy cập'}), 403

    return jsonify({'success': True, 'order_id': order_id, 'payment_status': row[0]})


# ─── POST /api/payment/ipn ────────────────────────────────
# SePay tự động gọi endpoint này khi có giao dịch thành công
# Không cần JWT — SePay xác thực bằng chữ ký
@payment_bp.route('/ipn', methods=['POST'])
def sepay_ipn():
    data = request.get_json(force=True, silent=True) or {}
    print(f"[IPN] Nhận từ SePay: {json.dumps(data, ensure_ascii=False)}")

    # Xác thực chữ ký IPN
    if not verify_ipn_signature(data, SEPAY_IPN_SECRET):
        print("[IPN] ❌ Chữ ký không hợp lệ!")
        return jsonify({'success': False, 'message': 'Invalid signature'}), 401

    notification_type = data.get('notification_type', '')
    if notification_type != 'ORDER_PAID':
        return jsonify({'success': True, 'message': 'Bỏ qua'}), 200

    order_data     = data.get('order', {})
    invoice_number = order_data.get('order_invoice_number', '')  # = order_code
    order_status   = order_data.get('order_status', '')

    print(f"[IPN] invoice={invoice_number}, status={order_status}")

    if order_status != 'CAPTURED':
        return jsonify({'success': True, 'message': 'Chưa hoàn tất'}), 200

    # Tìm đơn theo order_code
    row = db.session.execute(db.text("""
        SELECT id, payment_status FROM orders WHERE order_code = :code
    """), {'code': invoice_number}).fetchone()

    if not row:
        print(f"[IPN] Không tìm thấy đơn: {invoice_number}")
        return jsonify({'success': True, 'message': 'Không tìm thấy đơn'}), 200

    if row[1] == 'paid':
        return jsonify({'success': True, 'message': 'Đã xử lý rồi'}), 200

    try:
        db.session.execute(db.text("""
            UPDATE orders
            SET payment_status = 'paid',
                status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END
            WHERE id = :oid
        """), {'oid': row[0]})
        db.session.commit()
        print(f"[IPN] ✅ Đơn #{row[0]} ({invoice_number}) đã thanh toán!")
        return jsonify({'success': True, 'message': 'OK'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[IPN] ❌ Lỗi: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500