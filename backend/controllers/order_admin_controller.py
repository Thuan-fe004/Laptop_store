# backend/controllers/order_admin_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db

order_admin_bp = Blueprint('order_admin', __name__)

STATUS_LIST  = ['pending', 'processing', 'shipping', 'delivered', 'cancelled']
STATUS_LABEL = {
    'pending':    'Chờ xác nhận',
    'processing': 'Đang xử lý',
    'shipping':   'Đang giao',
    'delivered':  'Đã giao',
    'cancelled':  'Đã huỷ',
}

# Luồng trạng thái hợp lệ
VALID_NEXT = {
    'pending':    ['processing', 'cancelled'],
    'processing': ['shipping',   'cancelled'],
    'shipping':   ['delivered',  'cancelled'],
    'delivered':  [],
    'cancelled':  [],
}

def admin_required_check():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None, (jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403)
    return True, None

def fmt(val):
    return int(val) if val is not None else 0


# GET /api/admin/orders/stats
@order_admin_bp.route('/orders/stats', methods=['GET'])
@jwt_required()
def get_order_stats():
    _, err = admin_required_check()
    if err: return err
    try:
        rows  = db.session.execute(db.text('SELECT status, COUNT(*) FROM orders GROUP BY status')).fetchall()
        stats = {r[0]: r[1] for r in rows}
        unpaid_count = db.session.execute(db.text(
            "SELECT COUNT(*) FROM orders WHERE payment_status='unpaid' AND status NOT IN ('cancelled')"
        )).scalar() or 0
        return jsonify({'success': True, 'data': {
            'total':        sum(stats.values()),
            'pending':      stats.get('pending',    0),
            'processing':   stats.get('processing', 0),
            'shipping':     stats.get('shipping',   0),
            'delivered':    stats.get('delivered',  0),
            'cancelled':    stats.get('cancelled',  0),
            'unpaid_count': unpaid_count,
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# GET /api/admin/orders
@order_admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    _, err = admin_required_check()
    if err: return err
    try:
        page    = request.args.get('page',           1,  type=int)
        per_pg  = request.args.get('per_page',       10, type=int)
        search  = request.args.get('search',         '', type=str).strip()
        status  = request.args.get('status',         '', type=str).strip()
        payment = request.args.get('payment_status', '', type=str).strip()

        where, params = ['1=1'], {}
        if search:
            where.append('(o.order_code LIKE :q OR u.name LIKE :q OR u.email LIKE :q)')
            params['q'] = f'%{search}%'
        if status in STATUS_LIST:
            where.append('o.status = :status'); params['status'] = status
        if payment in ('unpaid', 'paid', 'refunded'):
            where.append('o.payment_status = :payment'); params['payment'] = payment

        w     = ' AND '.join(where)
        total = db.session.execute(db.text(
            f'SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id=u.id WHERE {w}'
        ), params).scalar() or 0

        params.update({'limit': per_pg, 'offset': (page - 1) * per_pg})
        rows = db.session.execute(db.text(f"""
            SELECT o.id, o.order_code, o.user_id,
                   u.name, u.email, u.phone,
                   o.total_price, o.discount, o.shipping_fee, o.final_price,
                   o.status, o.payment_method, o.payment_status,
                   o.note, o.cancelled_reason, o.created_at,
                   COUNT(oi.id) AS item_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE {w}
            GROUP BY o.id ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params).fetchall()

        return jsonify({
            'success': True,
            'data': [{
                'id': r[0], 'order_code': r[1], 'user_id': r[2],
                'customer_name': r[3], 'customer_email': r[4], 'customer_phone': r[5],
                'total_price': fmt(r[6]), 'discount': fmt(r[7]),
                'shipping_fee': fmt(r[8]), 'final_price': fmt(r[9]),
                'status': r[10], 'payment_method': r[11], 'payment_status': r[12],
                'note': r[13], 'cancelled_reason': r[14],
                'created_at': r[15].strftime('%Y-%m-%d %H:%M') if r[15] else None,
                'item_count': r[16],
            } for r in rows],
            'pagination': {'page': page, 'per_page': per_pg, 'total': total, 'pages': max(1, -(-total // per_pg))},
        })
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# GET /api/admin/orders/<id>
@order_admin_bp.route('/orders/<int:oid>', methods=['GET'])
@jwt_required()
def get_order(oid):
    _, err = admin_required_check()
    if err: return err
    try:
        row = db.session.execute(db.text("""
            SELECT o.id, o.order_code, o.user_id, u.name, u.email, u.phone,
                   o.total_price, o.discount, o.shipping_fee, o.final_price,
                   o.status, o.payment_method, o.payment_status,
                   o.note, o.cancelled_reason, o.created_at, o.updated_at,
                   c.code AS coupon_code
            FROM orders o JOIN users u ON o.user_id=u.id
            LEFT JOIN coupons c ON o.coupon_id=c.id
            WHERE o.id=:id
        """), {'id': oid}).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Đơn hàng không tồn tại'}), 404

        items = db.session.execute(db.text(
            'SELECT id,product_id,product_name,product_image,quantity,unit_price,subtotal FROM order_items WHERE order_id=:id'
        ), {'id': oid}).fetchall()
        ship = db.session.execute(db.text(
            'SELECT receiver_name,receiver_phone,address,ward,district,province,postal_code FROM shipping_info WHERE order_id=:id'
        ), {'id': oid}).fetchone()

        return jsonify({'success': True, 'data': {
            'id': row[0], 'order_code': row[1], 'user_id': row[2],
            'customer_name': row[3], 'customer_email': row[4], 'customer_phone': row[5],
            'total_price': fmt(row[6]), 'discount': fmt(row[7]),
            'shipping_fee': fmt(row[8]), 'final_price': fmt(row[9]),
            'status': row[10], 'payment_method': row[11], 'payment_status': row[12],
            'note': row[13], 'cancelled_reason': row[14],
            'created_at': row[15].strftime('%Y-%m-%d %H:%M') if row[15] else None,
            'updated_at': row[16].strftime('%Y-%m-%d %H:%M') if row[16] else None,
            'coupon_code': row[17],
            'items': [{'id':i[0],'product_id':i[1],'product_name':i[2],'product_image':i[3],
                       'quantity':i[4],'unit_price':fmt(i[5]),'subtotal':fmt(i[6])} for i in items],
            'shipping_info': {'receiver_name':ship[0],'receiver_phone':ship[1],'address':ship[2],
                              'ward':ship[3],'district':ship[4],'province':ship[5],'postal_code':ship[6]} if ship else None,
        }})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# PUT /api/admin/orders/<id>/status
# Logic tự động payment:
#   COD + delivered  → payment = 'paid'   (giao xong = thu tiền xong)
#   any + cancelled  → payment = 'refunded' nếu đã paid, 'unpaid' nếu chưa
#   Online + delivered → giữ nguyên (admin xác nhận riêng qua API /payment)
@order_admin_bp.route('/orders/<int:oid>/status', methods=['PUT'])
@jwt_required()
def update_order_status(oid):
    _, err = admin_required_check()
    if err: return err
    try:
        body       = request.get_json() or {}
        new_status = (body.get('status') or '').strip()
        reason     = (body.get('cancelled_reason') or '').strip()

        if new_status not in STATUS_LIST:
            return jsonify({'success': False, 'message': 'Trạng thái không hợp lệ'}), 400

        row = db.session.execute(db.text(
            'SELECT id,status,order_code,payment_method,payment_status FROM orders WHERE id=:id'
        ), {'id': oid}).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Đơn hàng không tồn tại'}), 404

        cur_status, order_code, pay_method, cur_pay = row[1], row[2], row[3], row[4]

        # Validate luồng
        if cur_status in ('delivered', 'cancelled'):
            return jsonify({'success': False,
                'message': f'Đơn đã "{STATUS_LABEL[cur_status]}", không thể thay đổi'}), 400

        allowed = VALID_NEXT.get(cur_status, [])
        if new_status not in allowed:
            allowed_labels = [STATUS_LABEL[s] for s in allowed]
            return jsonify({'success': False,
                'message': f'Không thể chuyển "{STATUS_LABEL[cur_status]}" → "{STATUS_LABEL[new_status]}". '
                           f'Chỉ được: {", ".join(allowed_labels)}'}), 400

        if new_status == 'cancelled' and not reason:
            return jsonify({'success': False, 'message': 'Vui lòng nhập lý do huỷ đơn'}), 400

        # ── Tự động tính payment_status ──────────────────
        new_pay = cur_pay  # mặc định giữ nguyên

        if new_status == 'delivered':
            if pay_method == 'cod':
                new_pay = 'paid'        # COD: giao xong → thu tiền xong → tự động paid
            # Online: giữ nguyên, admin xác nhận riêng

        elif new_status == 'cancelled':
            new_pay = 'refunded' if cur_pay == 'paid' else 'unpaid'

        # ── Cập nhật DB ───────────────────────────────────
        db.session.execute(db.text("""
            UPDATE orders SET
                status           = :status,
                payment_status   = :pay,
                cancelled_reason = :reason,
                updated_at       = NOW()
            WHERE id = :id
        """), {'status': new_status, 'pay': new_pay,
               'reason': reason if new_status == 'cancelled' else None, 'id': oid})
        db.session.commit()

        pay_labels = {'paid': 'Đã thanh toán', 'refunded': 'Đã hoàn tiền', 'unpaid': 'Chưa thanh toán'}
        msg = f'Đã cập nhật đơn {order_code} → {STATUS_LABEL[new_status]}'
        if new_pay != cur_pay:
            msg += f' (Thanh toán: {pay_labels[new_pay]})'

        return jsonify({
            'success': True, 'message': msg,
            'new_status': new_status, 'new_payment': new_pay,
            'payment_changed': new_pay != cur_pay,
        })
    except Exception as e:
        db.session.rollback()
        import traceback; traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
def _admin_check():
    claims = get_jwt()
    return claims.get('role') == 'admin'

# ─── PUT /admin/orders/<id>/payment — xác nhận TT thủ công ─
@order_admin_bp.route('/orders/<int:order_id>/payment', methods=['PUT'])
@jwt_required()
def update_payment(order_id):
    if not _admin_check():
        return jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403
 
    # FIX: dùng force=True để tránh lỗi 415
    data           = request.get_json(force=True, silent=True) or {}
    payment_status = data.get('payment_status')
 
    if payment_status not in ('unpaid', 'paid', 'refunded'):
        return jsonify({'success': False, 'message': 'Trạng thái thanh toán không hợp lệ'}), 400
 
    row = db.session.execute(
        db.text("SELECT id, payment_status FROM orders WHERE id = :id"),
        {'id': order_id}
    ).fetchone()
 
    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đơn hàng'}), 404
 
    if row[1] == payment_status:
        return jsonify({'success': True, 'message': 'Trạng thái không thay đổi'})
 
    db.session.execute(db.text("""
        UPDATE orders SET payment_status = :ps WHERE id = :id
    """), {'ps': payment_status, 'id': order_id})
    db.session.commit()
 
    labels = {'unpaid': 'Chưa thanh toán', 'paid': 'Đã thanh toán', 'refunded': 'Đã hoàn tiền'}
    return jsonify({
        'success': True,
        'message': f'Đã cập nhật thanh toán → {labels[payment_status]}'
    })