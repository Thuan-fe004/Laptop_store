# controllers/order_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
import uuid
from datetime import datetime

order_bp = Blueprint('order', __name__)


def gen_order_code():
    now = datetime.now()
    return f"ORD{now.strftime('%Y%m%d')}{str(uuid.uuid4().int)[:6].upper()}"


# ─── GET /orders — Danh sách đơn hàng của user ──────────
@order_bp.route('', methods=['GET'])
@jwt_required()
def get_orders():
    user_id  = int(get_jwt_identity())
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 8, type=int)
    status   = request.args.get('status', None)
    offset   = (page - 1) * per_page

    params = {'uid': user_id, 'limit': per_page, 'offset': offset}
    where  = "WHERE o.user_id = :uid"
    if status:
        where += " AND o.status = :status"
        params['status'] = status

    total = db.session.execute(
        db.text(f"SELECT COUNT(*) FROM orders o {where}"), params
    ).scalar()

    rows = db.session.execute(db.text(f"""
        SELECT o.id, o.order_code, o.total_price, o.discount, o.shipping_fee,
               o.final_price, o.status, o.payment_method, o.payment_status,
               o.note, o.created_at
        FROM orders o
        {where}
        ORDER BY o.created_at DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    orders = []
    for r in rows:
        oid = r[0]
        # Lấy items của đơn — thêm product_id để frontend review được
        items_rows = db.session.execute(db.text("""
            SELECT product_id, product_name, product_image, quantity, unit_price, subtotal
            FROM order_items WHERE order_id = :oid
        """), {'oid': oid}).fetchall()

        orders.append({
            'id':             oid,
            'order_code':     r[1],
            'total_price':    int(r[2]),
            'discount':       int(r[3]),
            'shipping_fee':   int(r[4]),
            'final_price':    int(r[5]),
            'status':         r[6],
            'payment_method': r[7],
            'payment_status': r[8],
            'note':           r[9],
            'created_at':     r[10].isoformat() if r[10] else None,
            'items': [{
                'product_id':    it[0],
                'product_name':  it[1],
                'product_image': it[2],
                'quantity':      it[3],
                'unit_price':    int(it[4]),
                'subtotal':      int(it[5]),
            } for it in items_rows],
        })

    return jsonify({
        'success': True,
        'data': orders,
        'pagination': {
            'page': page, 'per_page': per_page,
            'total': total, 'total_pages': (total + per_page - 1) // per_page,
        }
    })


# ─── GET /orders/<id> — Chi tiết đơn hàng ───────────────
@order_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    user_id = int(get_jwt_identity())

    row = db.session.execute(db.text("""
        SELECT o.id, o.order_code, o.total_price, o.discount, o.shipping_fee,
               o.final_price, o.status, o.payment_method, o.payment_status,
               o.note, o.cancelled_reason, o.created_at
        FROM orders o
        WHERE o.id = :oid AND o.user_id = :uid
    """), {'oid': order_id, 'uid': user_id}).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đơn hàng'}), 404

    # ✅ Thêm product_id để frontend gửi review được
    items_rows = db.session.execute(db.text("""
        SELECT product_id, product_name, product_image, quantity, unit_price, subtotal
        FROM order_items WHERE order_id = :oid
    """), {'oid': order_id}).fetchall()

    ship = db.session.execute(db.text("""
        SELECT receiver_name, receiver_phone, address, ward, district, province
        FROM shipping_info WHERE order_id = :oid
    """), {'oid': order_id}).fetchone()

    return jsonify({
        'success': True,
        'data': {
            'id':               row[0],
            'order_code':       row[1],
            'total_price':      int(row[2]),
            'discount':         int(row[3]),
            'shipping_fee':     int(row[4]),
            'final_price':      int(row[5]),
            'status':           row[6],
            'payment_method':   row[7],
            'payment_status':   row[8],
            'note':             row[9],
            'cancelled_reason': row[10],
            'created_at':       row[11].isoformat() if row[11] else None,
            'items': [{
                'product_id':    it[0],
                'product_name':  it[1],
                'product_image': it[2],
                'quantity':      it[3],
                'unit_price':    int(it[4]),
                'subtotal':      int(it[5]),
            } for it in items_rows],
            'shipping_info': {
                'receiver_name':  ship[0],
                'receiver_phone': ship[1],
                'address':        ship[2],
                'ward':           ship[3],
                'district':       ship[4],
                'province':       ship[5],
            } if ship else None,
        }
    })


# ─── POST /orders — Đặt hàng ────────────────────────────
@order_bp.route('', methods=['POST'])
@jwt_required()
def place_order():
    user_id = int(get_jwt_identity())
    data    = request.get_json(force=True, silent=True) or {}

    ship_info         = data.get('shipping_info', {})
    payment_method    = data.get('payment_method', 'cod')
    coupon_code       = data.get('coupon_code', None)
    # Danh sách product_id được chọn từ giỏ hàng (frontend gửi lên)
    # Nếu không có → lấy tất cả (backward compatible)
    selected_ids      = data.get('selected_product_ids', None)

    # Validate shipping
    required = ['receiver_name', 'receiver_phone', 'address', 'district', 'province']
    for f in required:
        if not ship_info.get(f, '').strip():
            return jsonify({'success': False, 'message': f'Thiếu thông tin: {f}'}), 400

    # Lấy giỏ hàng
    cart_row = db.session.execute(
        db.text("SELECT id FROM carts WHERE user_id = :uid"), {'uid': user_id}
    ).fetchone()
    if not cart_row:
        return jsonify({'success': False, 'message': 'Giỏ hàng trống'}), 400

    cart_id = cart_row[0]

    # Lấy cart items — nếu có selected_ids thì chỉ lấy những sp được chọn
    if selected_ids and len(selected_ids) > 0:
        # Tạo IN clause an toàn bằng bindparam riêng
        placeholders = ','.join([f':pid_{i}' for i in range(len(selected_ids))])
        pid_params   = {f'pid_{i}': int(v) for i, v in enumerate(selected_ids)}
        pid_params['cid'] = cart_id
        cart_items = db.session.execute(db.text(f"""
            SELECT ci.product_id, ci.quantity, p.name, p.price, p.sale_price,
                   p.quantity AS stock, pi.image_url
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id AND p.status = 1
            LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
            WHERE ci.cart_id = :cid
              AND ci.product_id IN ({placeholders})
        """), pid_params).fetchall()
    else:
        cart_items = db.session.execute(db.text("""
            SELECT ci.product_id, ci.quantity, p.name, p.price, p.sale_price,
                   p.quantity AS stock, pi.image_url
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id AND p.status = 1
            LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
            WHERE ci.cart_id = :cid
        """), {'cid': cart_id}).fetchall()

    if not cart_items:
        return jsonify({'success': False, 'message': 'Không có sản phẩm nào được chọn'}), 400

    # Kiểm tra tồn kho
    for it in cart_items:
        if it[1] > it[5]:
            return jsonify({'success': False, 'message': f'Sản phẩm "{it[2]}" chỉ còn {it[5]} cái'}), 400

    # Tính tiền
    subtotal  = sum((int(it[4]) if it[4] else int(it[3])) * it[1] for it in cart_items)
    shipping  = 0 if subtotal >= 10000000 else 50000
    discount  = 0
    coupon_id = None

    if coupon_code:
        coupon = db.session.execute(db.text("""
            SELECT id, discount_type, discount_value, max_discount, min_order, max_uses, used_count
            FROM coupons
            WHERE code = :code AND is_active = 1
              AND (starts_at IS NULL OR starts_at <= NOW())
              AND (expires_at IS NULL OR expires_at >= NOW())
        """), {'code': coupon_code}).fetchone()

        if coupon and subtotal >= int(coupon[4]):
            if coupon[5] == 0 or coupon[6] < coupon[5]:
                if coupon[1] == 'percent':
                    raw = subtotal * float(coupon[2]) / 100
                    discount = int(min(raw, coupon[3]) if coupon[3] else raw)
                else:
                    discount  = int(coupon[2])
                coupon_id = coupon[0]

    final_price = subtotal + shipping - discount
    order_code  = gen_order_code()

    try:
        # Tạo đơn hàng
        db.session.execute(db.text("""
            INSERT INTO orders
              (order_code, user_id, coupon_id, total_price, discount, shipping_fee,
               final_price, status, payment_method, payment_status, note)
            VALUES
              (:code, :uid, :cid, :total, :disc, :ship,
               :final, 'pending', :pm, 'unpaid', :note)
        """), {
            'code': order_code, 'uid': user_id, 'cid': coupon_id,
            'total': subtotal, 'disc': discount, 'ship': shipping,
            'final': final_price, 'pm': payment_method,
            'note': ship_info.get('note', ''),
        })

        order_id = db.session.execute(db.text("SELECT LAST_INSERT_ID()")).scalar()

        # Tạo order items + trừ kho
        for it in cart_items:
            price    = int(it[4]) if it[4] else int(it[3])
            subtotal_item = price * it[1]
            db.session.execute(db.text("""
                INSERT INTO order_items
                  (order_id, product_id, product_name, product_image, quantity, unit_price, subtotal)
                VALUES (:oid, :pid, :pname, :pimg, :qty, :price, :sub)
            """), {
                'oid': order_id, 'pid': it[0], 'pname': it[2],
                'pimg': it[6], 'qty': it[1], 'price': price, 'sub': subtotal_item,
            })

            db.session.execute(db.text("""
                UPDATE products
                SET quantity   = quantity - :qty,
                    sold_count = sold_count + :qty
                WHERE id = :pid
            """), {'qty': it[1], 'pid': it[0]})

        # Shipping info
        db.session.execute(db.text("""
            INSERT INTO shipping_info
              (order_id, receiver_name, receiver_phone, address, ward, district, province, note)
            VALUES (:oid, :rn, :rp, :addr, :ward, :dist, :prov, :note)
        """), {
            'oid':  order_id,
            'rn':   ship_info['receiver_name'],
            'rp':   ship_info['receiver_phone'],
            'addr': ship_info['address'],
            'ward': ship_info.get('ward', ''),
            'dist': ship_info['district'],
            'prov': ship_info['province'],
            'note': ship_info.get('note', ''),
        })

        # Chỉ xóa các sp đã đặt khỏi giỏ (không xóa sp chưa chọn)
        ordered_product_ids = [it[0] for it in cart_items]
        for pid in ordered_product_ids:
            db.session.execute(
                db.text("DELETE FROM cart_items WHERE cart_id = :cid AND product_id = :pid"),
                {'cid': cart_id, 'pid': pid}
            )

        # Tăng used_count coupon
        if coupon_id:
            db.session.execute(
                db.text("UPDATE coupons SET used_count = used_count + 1 WHERE id = :id"),
                {'id': coupon_id}
            )

        db.session.commit()

        return jsonify({
            'success':    True,
            'message':    'Đặt hàng thành công!',
            'order_id':   order_id,
            'order_code': order_code,
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── PUT /orders/<id>/cancel — Hủy đơn ──────────────────
@order_bp.route('/<int:order_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(order_id):
    user_id = int(get_jwt_identity())
    # FIX 415: dùng force=True + silent=True để parse body tuỳ ý,
    # tránh Flask reject khi Content-Type không phải application/json
    data = request.get_json(force=True, silent=True) or {}

    row = db.session.execute(db.text("""
        SELECT id, status FROM orders WHERE id = :oid AND user_id = :uid
    """), {'oid': order_id, 'uid': user_id}).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đơn hàng'}), 404
    if row[1] not in ('pending', 'processing'):
        return jsonify({'success': False, 'message': 'Không thể hủy đơn ở trạng thái này'}), 400

    # Hoàn lại tồn kho
    items = db.session.execute(db.text("""
        SELECT product_id, quantity FROM order_items WHERE order_id = :oid
    """), {'oid': order_id}).fetchall()

    for it in items:
        db.session.execute(db.text("""
            UPDATE products SET quantity = quantity + :qty, sold_count = sold_count - :qty
            WHERE id = :pid
        """), {'qty': it[1], 'pid': it[0]})

    db.session.execute(db.text("""
        UPDATE orders SET status = 'cancelled', cancelled_reason = :reason WHERE id = :oid
    """), {'reason': data.get('reason', 'Khách hủy'), 'oid': order_id})
    db.session.commit()

    return jsonify({'success': True, 'message': 'Đã hủy đơn hàng'})