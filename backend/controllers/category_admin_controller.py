# backend/controllers/category_admin_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db

category_admin_bp = Blueprint('category_admin', __name__)


# ── Helper kiểm tra quyền Admin ──────────────────────
def admin_required_check():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None, (jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403)
    return True, None


# ════════════════════════════════════════════════════
# GET /api/admin/categories
# ════════════════════════════════════════════════════
@category_admin_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    _, err = admin_required_check()
    if err: return err

    try:
        page     = request.args.get('page',     1,    type=int)
        per_page = request.args.get('per_page', 10,   type=int)
        search   = request.args.get('search',   '',   type=str).strip()
        status   = request.args.get('status',   None, type=str)

        where, params = ['1=1'], {}

        if search:
            where.append('(c.name LIKE :q OR c.description LIKE :q)')
            params['q'] = f'%{search}%'
        if status in ('0', '1'):
            where.append('c.status = :status')
            params['status'] = int(status)

        w = ' AND '.join(where)

        # Đếm tổng
        total = db.session.execute(
            db.text(f'SELECT COUNT(*) FROM categories c WHERE {w}'), params
        ).scalar() or 0

        # Lấy dữ liệu + số sản phẩm
        params.update({'limit': per_page, 'offset': (page - 1) * per_page})
        rows = db.session.execute(db.text(f"""
            SELECT c.id, c.name, c.description, c.status, c.created_at,
                   COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            WHERE {w}
            GROUP BY c.id, c.name, c.description, c.status, c.created_at
            ORDER BY c.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params).fetchall()

        data = [{
            'id':            r[0],
            'name':          r[1],
            'description':   r[2] or '',
            # ✅ FIX: ép kiểu rõ ràng - MySQL TINYINT đôi khi trả bytes/bool
            'status':        1 if r[3] else 0,
            'created_at':    r[4].strftime('%Y-%m-%d %H:%M') if r[4] else None,
            'product_count': int(r[5]),
        } for r in rows]

        return jsonify({
            'success': True,
            'data': data,
            'pagination': {
                'page':     page,
                'per_page': per_page,
                'total':    total,
                'pages':    max(1, -(-total // per_page)),
            }
        })
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# GET /api/admin/categories/<id>
# ════════════════════════════════════════════════════
@category_admin_bp.route('/categories/<int:cid>', methods=['GET'])
@jwt_required()
def get_category(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        row = db.session.execute(
            db.text('SELECT id, name, description, status, created_at FROM categories WHERE id = :id'),
            {'id': cid}
        ).fetchone()

        if not row:
            return jsonify({'success': False, 'message': 'Danh mục không tồn tại'}), 404

        return jsonify({'success': True, 'data': {
            'id':          row[0],
            'name':        row[1],
            'description': row[2] or '',
            'status':      1 if row[3] else 0,   # ✅ FIX: tránh TINYINT bytes
            'created_at':  row[4].strftime('%Y-%m-%d %H:%M') if row[4] else None,
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# POST /api/admin/categories
# ════════════════════════════════════════════════════
@category_admin_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    _, err = admin_required_check()
    if err: return err

    try:
        body        = request.get_json() or {}
        name        = (body.get('name') or '').strip()
        description = (body.get('description') or '').strip()
        status      = int(body.get('status', 1))

        if not name:
            return jsonify({'success': False, 'message': 'Tên danh mục không được để trống'}), 400
        if len(name) > 100:
            return jsonify({'success': False, 'message': 'Tên danh mục tối đa 100 ký tự'}), 400

        # Kiểm tra trùng tên
        exists = db.session.execute(
            db.text('SELECT id FROM categories WHERE LOWER(name) = LOWER(:name)'),
            {'name': name}
        ).fetchone()
        if exists:
            return jsonify({'success': False, 'message': 'Tên danh mục đã tồn tại'}), 409

        db.session.execute(db.text(
            'INSERT INTO categories (name, description, status, created_at) '
            'VALUES (:name, :desc, :status, NOW())'
        ), {'name': name, 'desc': description, 'status': status})
        db.session.commit()

        new_id = db.session.execute(db.text('SELECT LAST_INSERT_ID()')).scalar()

        return jsonify({
            'success': True,
            'message': 'Thêm danh mục thành công',
            'data':    {'id': new_id, 'name': name}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# PUT /api/admin/categories/<id>
# ════════════════════════════════════════════════════
@category_admin_bp.route('/categories/<int:cid>', methods=['PUT'])
@jwt_required()
def update_category(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        exists = db.session.execute(
            db.text('SELECT id FROM categories WHERE id = :id'), {'id': cid}
        ).fetchone()
        if not exists:
            return jsonify({'success': False, 'message': 'Danh mục không tồn tại'}), 404

        body        = request.get_json() or {}
        name        = (body.get('name') or '').strip()
        description = (body.get('description') or '').strip()
        status      = int(body.get('status', 1))

        if not name:
            return jsonify({'success': False, 'message': 'Tên danh mục không được để trống'}), 400
        if len(name) > 100:
            return jsonify({'success': False, 'message': 'Tên danh mục tối đa 100 ký tự'}), 400

        # Kiểm tra trùng tên (bỏ qua chính nó)
        dup = db.session.execute(
            db.text('SELECT id FROM categories WHERE LOWER(name) = LOWER(:name) AND id != :id'),
            {'name': name, 'id': cid}
        ).fetchone()
        if dup:
            return jsonify({'success': False, 'message': 'Tên danh mục đã tồn tại'}), 409

        db.session.execute(db.text(
            'UPDATE categories SET name=:name, description=:desc, status=:status WHERE id=:id'
        ), {'name': name, 'desc': description, 'status': status, 'id': cid})
        db.session.commit()

        return jsonify({'success': True, 'message': 'Cập nhật danh mục thành công'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# PUT /api/admin/categories/<id>/status  — toggle ẩn/hiện
# ════════════════════════════════════════════════════
@category_admin_bp.route('/categories/<int:cid>/status', methods=['PUT'])
@jwt_required()
def toggle_status(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        row = db.session.execute(
            db.text('SELECT id, name, status FROM categories WHERE id = :id'), {'id': cid}
        ).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Danh mục không tồn tại'}), 404

        new_status = 0 if (1 if row[2] else 0) == 1 else 1   # ✅ FIX: chuẩn hoá trước khi so sánh
        db.session.execute(
            db.text('UPDATE categories SET status = :s WHERE id = :id'),
            {'s': new_status, 'id': cid}
        )
        db.session.commit()

        action = 'hiện' if new_status == 1 else 'ẩn'
        return jsonify({
            'success':    True,
            'message':    f"Đã {action} danh mục '{row[1]}'",
            'new_status': new_status,
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# DELETE /api/admin/categories/<id>
# ════════════════════════════════════════════════════
@category_admin_bp.route('/categories/<int:cid>', methods=['DELETE'])
@jwt_required()
def delete_category(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        row = db.session.execute(
            db.text('SELECT id, name FROM categories WHERE id = :id'), {'id': cid}
        ).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Danh mục không tồn tại'}), 404

        cnt = db.session.execute(
            db.text('SELECT COUNT(*) FROM products WHERE category_id = :id'), {'id': cid}
        ).scalar()
        if cnt > 0:
            return jsonify({
                'success': False,
                'message': f'Không thể xoá! Danh mục đang có {cnt} sản phẩm.'
            }), 400

        db.session.execute(
            db.text('DELETE FROM categories WHERE id = :id'), {'id': cid}
        )
        db.session.commit()
        return jsonify({'success': True, 'message': f"Đã xoá danh mục '{row[1]}'"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500