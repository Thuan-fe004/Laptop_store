# controllers/payment_controller.py
import hmac
import hashlib
import base64
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db

payment_bp = Blueprint('payment', __name__)

SEPAY_MERCHANT_ID  = "SP-LIVE-TV245266"
SEPAY_SECRET_KEY   = "spsk_live_AAwqcEFmEtPoYJ37xKbYAi2Afs8Ukgqk"
SEPAY_IPN_SECRET   = "Thuan2004@"
SEPAY_CHECKOUT_URL = "https://pay.sepay.vn/v1/checkout/init"
FRONTEND_URL       = "https://laptopstore-ten.vercel.app"

# Thứ tự field cố định theo SePay — KHÔNG thay đổi
SIGNED_FIELDS = [
    'order_amount', 'merchant', 'currency', 'operation',
    'order_description', 'order_invoice_number', 'customer_id',
    'payment_method', 'success_url', 'error_url', 'cancel_url',
]


def generate_signature(data: dict, secret_key: str) -> str:
    signed_parts = []
    for field in SIGNED_FIELDS:
        if field in data and data[field] is not None and str(data[field]) != '':
            signed_parts.append(f"{field}={data[field]}")
    signed_string = ','.join(signed_parts)
    print(f"[SEPAY] Signed string: {signed_string}")
    raw_hmac = hmac.new(
        secret_key.encode('utf-8'),
        signed_string.encode('utf-8'),
        hashlib.sha256
    ).digest()
    return base64.b64encode(raw_hmac).decode('utf-8')


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

    # Chỉ dùng các field bắt buộc — bỏ payment_method và customer_id
    form_data = {
        'order_amount':         str(final_price),
        'merchant':             SEPAY_MERCHANT_ID,
        'currency':             'VND',
        'operation':            'PURCHASE',
        'order_description':    f'Thanh toan {order_code}',
        'order_invoice_number': order_code,
        'success_url':          f'{FRONTEND_URL}/orders',
        'error_url':            f'{FRONTEND_URL}/orders',
        'cancel_url':           f'{FRONTEND_URL}/checkout',
    }

    form_data['signature'] = generate_signature(form_data, SEPAY_SECRET_KEY)
    print(f"[SEPAY] Signature: {form_data['signature']}")
    print(f"[SEPAY] Form tạo xong cho đơn {order_code}")

    return jsonify({
        'success':     True,
        'use_form':    True,
        'action_url':  SEPAY_CHECKOUT_URL,
        'form_fields': form_data,
        'order_code':  order_code,
    })


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


@payment_bp.route('/ipn', methods=['POST'])
def sepay_ipn():
    data = request.get_json(force=True, silent=True) or {}
    print(f"[IPN] Nhận từ SePay: {json.dumps(data, ensure_ascii=False)}")

    if data.get('notification_type') != 'ORDER_PAID':
        return jsonify({'success': True, 'message': 'Bỏ qua'}), 200

    order_data     = data.get('order', {})
    invoice_number = order_data.get('order_invoice_number', '')
    order_status   = order_data.get('order_status', '')
    print(f"[IPN] invoice={invoice_number}, status={order_status}")

    if order_status != 'CAPTURED':
        return jsonify({'success': True, 'message': 'Chưa hoàn tất'}), 200

    row = db.session.execute(db.text("""
        SELECT id, payment_status FROM orders WHERE order_code = :code
    """), {'code': invoice_number}).fetchone()

    if not row:
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