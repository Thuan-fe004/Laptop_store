# controllers/cart_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db

cart_bp = Blueprint('cart', __name__)


def get_cart_id(user_id):
    """Lấy cart_id của user, tạo mới nếu chưa có"""
    row = db.session.execute(
        db.text("SELECT id FROM carts WHERE user_id = :uid"), {'uid': user_id}
    ).fetchone()
    if row:
        return row[0]
    db.session.execute(
        db.text("INSERT INTO carts (user_id) VALUES (:uid)"), {'uid': user_id}
    )
    db.session.commit()
    return db.session.execute(
        db.text("SELECT LAST_INSERT_ID()")
    ).scalar()


# ─── GET /cart — Lấy giỏ hàng ────────────────────────────
@cart_bp.route('', methods=['GET'])
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    cart_id = get_cart_id(user_id)

    rows = db.session.execute(db.text("""
        SELECT
            ci.product_id,
            ci.quantity,
            p.name,
            p.slug,
            p.price,
            p.sale_price,
            p.quantity AS stock,
            b.name AS brand_name,
            pi.image_url AS image
        FROM cart_items ci
        JOIN products p  ON p.id  = ci.product_id
        JOIN brands   b  ON b.id  = p.brand_id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
        WHERE ci.cart_id = :cid AND p.status = 1
        ORDER BY ci.added_at DESC
    """), {'cid': cart_id}).fetchall()

    items = []
    for r in rows:
        items.append({
            'product_id': r[0],
            'quantity':   r[1],
            'name':       r[2],
            'slug':       r[3],
            'price':      int(r[4]),
            'sale_price': int(r[5]) if r[5] else None,
            'stock':      r[6],
            'brand_name': r[7],
            'image':      r[8],
        })

    return jsonify({'success': True, 'data': items})


# ─── POST /cart — Thêm sản phẩm vào giỏ ─────────────────
@cart_bp.route('', methods=['POST'])
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    data    = request.get_json()
    prod_id = data.get('product_id')
    qty     = int(data.get('quantity', 1))

    if not prod_id or qty < 1:
        return jsonify({'success': False, 'message': 'Dữ liệu không hợp lệ'}), 400

    # Kiểm tra sản phẩm tồn tại và còn hàng
    prod = db.session.execute(
        db.text("SELECT id, quantity FROM products WHERE id = :id AND status = 1"),
        {'id': prod_id}
    ).fetchone()
    if not prod:
        return jsonify({'success': False, 'message': 'Sản phẩm không tồn tại'}), 404
    if prod[1] < qty:
        return jsonify({'success': False, 'message': f'Chỉ còn {prod[1]} sản phẩm trong kho'}), 400

    cart_id = get_cart_id(user_id)

    # Kiểm tra đã có trong giỏ chưa
    existing = db.session.execute(
        db.text("SELECT id, quantity FROM cart_items WHERE cart_id = :cid AND product_id = :pid"),
        {'cid': cart_id, 'pid': prod_id}
    ).fetchone()

    if existing:
        new_qty = existing[1] + qty
        if new_qty > prod[1]:
            return jsonify({'success': False, 'message': f'Chỉ còn {prod[1]} sản phẩm trong kho'}), 400
        db.session.execute(
            db.text("UPDATE cart_items SET quantity = :q WHERE id = :id"),
            {'q': new_qty, 'id': existing[0]}
        )
    else:
        db.session.execute(
            db.text("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (:cid, :pid, :q)"),
            {'cid': cart_id, 'pid': prod_id, 'q': qty}
        )

    db.session.commit()
    return jsonify({'success': True, 'message': 'Đã thêm vào giỏ hàng'})


# ─── PUT /cart/<product_id> — Cập nhật số lượng ─────────
@cart_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(product_id):
    user_id = int(get_jwt_identity())
    qty     = int(request.get_json().get('quantity', 1))

    if qty < 1:
        return jsonify({'success': False, 'message': 'Số lượng không hợp lệ'}), 400

    cart_id = get_cart_id(user_id)

    # Kiểm tra tồn kho
    stock = db.session.execute(
        db.text("SELECT quantity FROM products WHERE id = :id AND status = 1"),
        {'id': product_id}
    ).scalar()
    if stock is None:
        return jsonify({'success': False, 'message': 'Sản phẩm không tồn tại'}), 404
    if qty > stock:
        return jsonify({'success': False, 'message': f'Chỉ còn {stock} sản phẩm trong kho'}), 400

    db.session.execute(
        db.text("UPDATE cart_items SET quantity = :q WHERE cart_id = :cid AND product_id = :pid"),
        {'q': qty, 'cid': cart_id, 'pid': product_id}
    )
    db.session.commit()
    return jsonify({'success': True, 'message': 'Đã cập nhật giỏ hàng'})


# ─── DELETE /cart/<product_id> — Xóa 1 sản phẩm ────────
@cart_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_cart_item(product_id):
    user_id = int(get_jwt_identity())
    cart_id = get_cart_id(user_id)

    db.session.execute(
        db.text("DELETE FROM cart_items WHERE cart_id = :cid AND product_id = :pid"),
        {'cid': cart_id, 'pid': product_id}
    )
    db.session.commit()
    return jsonify({'success': True, 'message': 'Đã xóa khỏi giỏ hàng'})


# ─── DELETE /cart — Xóa toàn bộ giỏ ────────────────────
@cart_bp.route('', methods=['DELETE'])
@jwt_required()
def clear_cart():
    user_id = int(get_jwt_identity())
    cart_id = get_cart_id(user_id)

    db.session.execute(
        db.text("DELETE FROM cart_items WHERE cart_id = :cid"),
        {'cid': cart_id}
    )
    db.session.commit()
    return jsonify({'success': True, 'message': 'Đã xóa giỏ hàng'})