# controllers/review_controller.py
# ============================================================
# Quản lý đánh giá sản phẩm + Upload ảnh review
#
# Thêm vào .env:
#   UPLOAD_FOLDER=static/uploads
#
# Thêm vào app.py:
#   from controllers.review_controller import review_bp
#   app.register_blueprint(review_bp, url_prefix='/api')
#
# THÊM CỘT ảnh vào bảng reviews (chạy SQL này):
#   ALTER TABLE reviews ADD COLUMN images TEXT NULL COMMENT 'JSON array of image URLs';
# ============================================================

import os, json
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from extensions import db
import uuid

review_bp = Blueprint('review', __name__)


ALLOWED_EXT = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
MAX_SIZE    = 5 * 1024 * 1024  # 5MB

def _allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT


# ════════════════════════════════════════════════════════════
# POST /reviews/upload-images — Upload ảnh review
# ════════════════════════════════════════════════════════════
@review_bp.route('/reviews/upload-images', methods=['POST'])
@jwt_required()
def upload_review_images():
    files = request.files.getlist('images')
    if not files:
        return jsonify({'success': False, 'message': 'Không có ảnh nào được gửi'}), 400

    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'reviews')
    os.makedirs(upload_dir, exist_ok=True)

    urls = []
    for f in files[:5]:  # tối đa 5 ảnh
        if not _allowed(f.filename):
            continue
        f.seek(0, 2)
        if f.tell() > MAX_SIZE:
            continue
        f.seek(0)
        ext      = f.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        f.save(os.path.join(upload_dir, filename))
        urls.append(f"reviews/{filename}")

    return jsonify({'success': True, 'urls': urls})


# ════════════════════════════════════════════════════════════
# HELPER: refresh rating
# ════════════════════════════════════════════════════════════
def _refresh_product_rating(product_id):
    db.session.execute(db.text("""
        UPDATE products p
        SET
            avg_rating   = (
                SELECT COALESCE(ROUND(AVG(r.rating), 2), 0)
                FROM reviews r
                WHERE r.product_id = :pid AND r.status = 1
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews r
                WHERE r.product_id = :pid AND r.status = 1
            )
        WHERE p.id = :pid
    """), {'pid': product_id})
    db.session.commit()


# ════════════════════════════════════════════════════════════
# PUBLIC: GET /products/<id>/reviews
# Lấy danh sách đánh giá (đã được duyệt) của sản phẩm
# ════════════════════════════════════════════════════════════
@review_bp.route('/products/<int:product_id>/reviews', methods=['GET'])
def get_reviews(product_id):
    page     = request.args.get('page',     1,  type=int)
    per_page = request.args.get('per_page', 10, type=int)
    sort     = request.args.get('sort', 'newest')  # newest | highest | lowest
    offset   = (page - 1) * per_page

    order_sql = {
        'newest':  'r.created_at DESC',
        'highest': 'r.rating DESC, r.created_at DESC',
        'lowest':  'r.rating ASC,  r.created_at DESC',
    }.get(sort, 'r.created_at DESC')

    total = db.session.execute(db.text("""
        SELECT COUNT(*) FROM reviews r
        WHERE r.product_id = :pid AND r.status = 1
    """), {'pid': product_id}).scalar()

    rows = db.session.execute(db.text(f"""
        SELECT r.id, r.rating, r.comment, r.created_at,
               u.name AS user_name, u.avatar, r.images
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.product_id = :pid AND r.status = 1
        ORDER BY {order_sql}
        LIMIT :limit OFFSET :offset
    """), {'pid': product_id, 'limit': per_page, 'offset': offset}).fetchall()

    # Thống kê rating
    stats = db.session.execute(db.text("""
        SELECT rating, COUNT(*) AS cnt
        FROM reviews
        WHERE product_id = :pid AND status = 1
        GROUP BY rating
    """), {'pid': product_id}).fetchall()

    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for s in stats:
        rating_dist[s[0]] = s[1]

    reviews = [{
        'id':         r[0],
        'rating':     r[1],
        'comment':    r[2],
        'created_at': r[3].isoformat() if r[3] else None,
        'user_name':  r[4],
        'avatar':     r[5],
        'images':     json.loads(r[6]) if r[6] else [],
    } for r in rows]

    return jsonify({
        'success': True,
        'data':    reviews,
        'stats':   rating_dist,
        'pagination': {
            'page': page, 'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page,
        }
    })


# ════════════════════════════════════════════════════════════
# USER: POST /products/<id>/reviews — Đăng đánh giá
# ════════════════════════════════════════════════════════════
@review_bp.route('/products/<int:product_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(product_id):
    user_id = int(get_jwt_identity())
    data    = request.get_json(force=True, silent=True) or {}
    rating  = data.get('rating')
    comment = (data.get('comment') or '').strip()
    # Nhận danh sách URL ảnh từ frontend (đã upload trước)
    image_urls = data.get('image_urls', [])
    images_json = json.dumps(image_urls) if image_urls else None

    # Validate
    if not rating or int(rating) not in [1, 2, 3, 4, 5]:
        return jsonify({'success': False, 'message': 'Điểm đánh giá phải từ 1 đến 5'}), 400
    if not comment:
        return jsonify({'success': False, 'message': 'Vui lòng nhập nội dung đánh giá'}), 400
    if len(comment) < 10:
        return jsonify({'success': False, 'message': 'Đánh giá phải có ít nhất 10 ký tự'}), 400

    # Kiểm tra sản phẩm tồn tại
    prod = db.session.execute(
        db.text("SELECT id FROM products WHERE id = :id AND status = 1"),
        {'id': product_id}
    ).fetchone()
    if not prod:
        return jsonify({'success': False, 'message': 'Sản phẩm không tồn tại'}), 404

    # Kiểm tra đã mua hàng chưa (chỉ cho mua rồi mới review)
    purchased = db.session.execute(db.text("""
        SELECT COUNT(*) FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = :uid
          AND oi.product_id = :pid
          AND o.status = 'delivered'
    """), {'uid': user_id, 'pid': product_id}).scalar()

    if not purchased:
        return jsonify({
            'success': False,
            'message': 'Bạn cần mua và nhận sản phẩm này trước khi đánh giá'
        }), 403

    # Kiểm tra đã đánh giá chưa (mỗi user chỉ đánh giá 1 lần)
    existing = db.session.execute(db.text("""
        SELECT id FROM reviews
        WHERE product_id = :pid AND user_id = :uid
    """), {'pid': product_id, 'uid': user_id}).fetchone()

    if existing:
        db.session.execute(db.text("""
            UPDATE reviews
            SET rating = :rating, comment = :comment,
                images = :imgs, status = 1
            WHERE product_id = :pid AND user_id = :uid
        """), {'rating': int(rating), 'comment': comment,
               'imgs': images_json,
               'pid': product_id, 'uid': user_id})
        db.session.commit()
        _refresh_product_rating(product_id)
        return jsonify({'success': True, 'message': 'Đã cập nhật đánh giá của bạn!'})

    db.session.execute(db.text("""
        INSERT INTO reviews (product_id, user_id, rating, comment, images, status)
        VALUES (:pid, :uid, :rating, :comment, :imgs, 1)
    """), {'pid': product_id, 'uid': user_id,
           'rating': int(rating), 'comment': comment, 'imgs': images_json})
    db.session.commit()
    _refresh_product_rating(product_id)

    return jsonify({'success': True, 'message': 'Đánh giá của bạn đã được gửi!'}), 201


# ════════════════════════════════════════════════════════════
# USER: DELETE /reviews/<id> — Xóa đánh giá của mình
# ════════════════════════════════════════════════════════════
@review_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    user_id = int(get_jwt_identity())
    claims  = get_jwt()
    is_admin = claims.get('role') == 'admin'

    row = db.session.execute(
        db.text("SELECT id, product_id, user_id FROM reviews WHERE id = :id"),
        {'id': review_id}
    ).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đánh giá'}), 404

    # Chỉ chủ nhân hoặc admin mới được xóa
    if not is_admin and row[2] != user_id:
        return jsonify({'success': False, 'message': 'Không có quyền xóa đánh giá này'}), 403

    product_id = row[1]
    db.session.execute(
        db.text("DELETE FROM reviews WHERE id = :id"), {'id': review_id}
    )
    db.session.commit()
    _refresh_product_rating(product_id)

    return jsonify({'success': True, 'message': 'Đã xóa đánh giá'})


# ════════════════════════════════════════════════════════════
# ADMIN: GET /admin/reviews — Xem tất cả đánh giá
# ════════════════════════════════════════════════════════════
@review_bp.route('/admin/reviews', methods=['GET'])
@jwt_required()
def admin_get_reviews():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403

    page     = request.args.get('page',     1,  type=int)
    per_page = request.args.get('per_page', 15, type=int)
    status   = request.args.get('status',   None)
    search   = request.args.get('search',   '', type=str).strip()
    offset   = (page - 1) * per_page

    wheres = []
    params = {'limit': per_page, 'offset': offset}

    if status is not None and status != '':
        wheres.append("r.status = :status")
        params['status'] = int(status)
    if search:
        wheres.append("(u.name LIKE :search OR p.name LIKE :search OR r.comment LIKE :search)")
        params['search'] = f'%{search}%'

    where_sql = ('WHERE ' + ' AND '.join(wheres)) if wheres else ''

    total = db.session.execute(db.text(f"""
        SELECT COUNT(*) FROM reviews r
        JOIN users    u ON u.id = r.user_id
        JOIN products p ON p.id = r.product_id
        {where_sql}
    """), params).scalar()

    rows = db.session.execute(db.text(f"""
        SELECT r.id, r.rating, r.comment, r.status, r.created_at,
               u.name AS user_name, u.email,
               p.id AS product_id, p.name AS product_name
        FROM reviews r
        JOIN users    u ON u.id = r.user_id
        JOIN products p ON p.id = r.product_id
        {where_sql}
        ORDER BY r.created_at DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    return jsonify({
        'success': True,
        'data': [{
            'id':           r[0],
            'rating':       r[1],
            'comment':      r[2],
            'status':       r[3],
            'created_at':   r[4].strftime('%Y-%m-%d %H:%M') if r[4] else None,
            'user_name':    r[5],
            'user_email':   r[6],
            'product_id':   r[7],
            'product_name': r[8],
        } for r in rows],
        'pagination': {
            'page': page, 'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page,
        }
    })


# ════════════════════════════════════════════════════════════
# ADMIN: PUT /admin/reviews/<id>/status — Duyệt/Ẩn đánh giá
# ════════════════════════════════════════════════════════════
@review_bp.route('/admin/reviews/<int:review_id>/status', methods=['PUT'])
@jwt_required()
def admin_toggle_review(review_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403

    row = db.session.execute(
        db.text("SELECT id, status, product_id FROM reviews WHERE id = :id"),
        {'id': review_id}
    ).fetchone()

    if not row:
        return jsonify({'success': False, 'message': 'Không tìm thấy đánh giá'}), 404

    new_status = 0 if row[1] == 1 else 1
    db.session.execute(
        db.text("UPDATE reviews SET status = :s WHERE id = :id"),
        {'s': new_status, 'id': review_id}
    )
    db.session.commit()
    _refresh_product_rating(row[2])

    msg = 'Đã hiển thị đánh giá' if new_status == 1 else 'Đã ẩn đánh giá'
    return jsonify({'success': True, 'message': msg, 'new_status': new_status})