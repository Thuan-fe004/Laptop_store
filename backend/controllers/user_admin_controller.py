# backend/controllers/user_admin_controller.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
from datetime import datetime

user_admin_bp = Blueprint('user_admin', __name__)


# ─────────────────────────────────────────
# HELPER: Kiểm tra quyền Admin
# ─────────────────────────────────────────
def admin_required_check():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None, (jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403)
    return get_jwt_identity(), None


# ─────────────────────────────────────────
# QUẢN LÝ NGƯỜI DÙNG (Users)
# ─────────────────────────────────────────

@user_admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    _, err = admin_required_check()
    if err: return err
    try:
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search   = request.args.get('search', '').strip()
        role     = request.args.get('role', '')
        status   = request.args.get('status', '')
        offset   = (page - 1) * per_page

        where, params = ['1=1'], {}
        if search:
            where.append('(u.name LIKE :q OR u.email LIKE :q OR u.phone LIKE :q)')
            params['q'] = f'%{search}%'
        if role:
            where.append('u.role = :role')
            params['role'] = role
        if status != '':
            where.append('u.status = :status')
            params['status'] = int(status)

        w = ' AND '.join(where)
        total = db.session.execute(db.text(f"SELECT COUNT(*) FROM users u WHERE {w}"), params).scalar()
        params.update({'limit': per_page, 'offset': offset})

        rows = db.session.execute(db.text(f"""
            SELECT u.id, u.name, u.email, u.phone, u.address,
                   u.role, u.status, u.avatar, u.created_at,
                   COUNT(DISTINCT o.id) AS order_count,
                   COALESCE(SUM(CASE WHEN o.status='delivered' THEN o.final_price ELSE 0 END),0) AS total_spent
            FROM users u LEFT JOIN orders o ON u.id=o.user_id
            WHERE {w}
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params).fetchall()

        return jsonify({
            'success': True,
            'data': [{
                'id': r[0], 'name': r[1], 'email': r[2], 'phone': r[3],
                'address': r[4], 'role': r[5], 'status': r[6],
                'avatar': r[7], 'created_at': r[8].strftime('%Y-%m-%d %H:%M'),
                'order_count': r[9], 'total_spent': int(r[10])
            } for r in rows],
            'pagination': {
                'page': page, 'per_page': per_page,
                'total': total, 'pages': -(-total // per_page)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@user_admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_detail(user_id):
    _, err = admin_required_check()
    if err: return err
    try:
        user = db.session.execute(db.text(
            "SELECT id,name,email,phone,address,avatar,role,status,created_at FROM users WHERE id=:id"
        ), {'id': user_id}).fetchone()
        if not user:
            return jsonify({'success': False, 'message': 'Không tìm thấy người dùng'}), 404

        orders = db.session.execute(db.text("""
            SELECT id, order_code, final_price, status, payment_status, created_at
            FROM orders WHERE user_id=:uid ORDER BY created_at DESC LIMIT 10
        """), {'uid': user_id}).fetchall()

        return jsonify({'success': True, 'data': {
            'id': user[0], 'name': user[1], 'email': user[2],
            'phone': user[3], 'address': user[4], 'avatar': user[5],
            'role': user[6], 'status': user[7],
            'created_at': user[8].strftime('%Y-%m-%d %H:%M'),
            'orders': [{
                'id': o[0], 'order_code': o[1], 'final_price': int(o[2]),
                'status': o[3], 'payment_status': o[4],
                'created_at': o[5].strftime('%Y-%m-%d %H:%M')
            } for o in orders]
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@user_admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def toggle_user_status(user_id):
    current_id, err = admin_required_check()
    if err: return err
    try:
        if int(user_id) == int(current_id):
            return jsonify({'success': False, 'message': 'Không thể tự khoá tài khoản của mình'}), 400

        row = db.session.execute(db.text(
            "SELECT status, role FROM users WHERE id=:id"
        ), {'id': user_id}).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Không tìm thấy người dùng'}), 404
        if row[1] == 'admin':
            return jsonify({'success': False, 'message': 'Không thể khoá tài khoản Admin khác'}), 403

        new_status = 0 if row[0] == 1 else 1
        db.session.execute(db.text("UPDATE users SET status=:s WHERE id=:id"), {'s': new_status, 'id': user_id})
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Đã khoá tài khoản' if new_status == 0 else 'Đã mở khoá tài khoản',
            'data': {'status': new_status}
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@user_admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    _, err = admin_required_check()
    if err: return err
    try:
        data = request.get_json()
        allowed = ['name', 'phone', 'address', 'role', 'status']
        sets, params = [], {'id': user_id}
        for f in allowed:
            if f in data:
                sets.append(f"{f}=:{f}")
                params[f] = data[f]
        if not sets:
            return jsonify({'success': False, 'message': 'Không có dữ liệu cập nhật'}), 400

        db.session.execute(db.text(
            f"UPDATE users SET {', '.join(sets)}, updated_at=NOW() WHERE id=:id"
        ), params)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Cập nhật thành công'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@user_admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_id, err = admin_required_check()
    if err: return err
    try:
        if int(user_id) == int(current_id):
            return jsonify({'success': False, 'message': 'Không thể xoá chính mình'}), 400

        order_count = db.session.execute(db.text(
            "SELECT COUNT(*) FROM orders WHERE user_id=:id"
        ), {'id': user_id}).scalar()
        if order_count > 0:
            return jsonify({'success': False,
                'message': f'Không thể xoá: tài khoản đã có {order_count} đơn hàng. Hãy khoá tài khoản thay thế.'}), 400

        db.session.execute(db.text("DELETE FROM users WHERE id=:id"), {'id': user_id})
        db.session.commit()
        return jsonify({'success': True, 'message': 'Đã xoá người dùng'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@user_admin_bp.route('/users/export', methods=['GET'])
@jwt_required()
def export_users():
    _, err = admin_required_check()
    if err: return err
    try:
        rows = db.session.execute(db.text("""
            SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
                   COUNT(DISTINCT o.id),
                   COALESCE(SUM(CASE WHEN o.status='delivered' THEN o.final_price ELSE 0 END),0)
            FROM users u LEFT JOIN orders o ON u.id=o.user_id
            GROUP BY u.id ORDER BY u.created_at DESC
        """)).fetchall()
        return jsonify({'success': True, 'data': [{
            'ID': r[0], 'Họ tên': r[1], 'Email': r[2], 'Điện thoại': r[3],
            'Vai trò': r[4], 'Trạng thái': 'Hoạt động' if r[5] else 'Bị khoá',
            'Ngày đăng ký': r[6].strftime('%d/%m/%Y'), 'Số đơn': r[7], 'Tổng chi tiêu': int(r[8])
        } for r in rows]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500