# backend/controllers/coupon_admin_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db
from datetime import datetime

coupon_admin_bp = Blueprint('coupon_admin', __name__)


# ── Helper kiểm tra quyền Admin ──────────────────────
def admin_required_check():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None, (jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403)
    return True, None


# ════════════════════════════════════════════════════
# GET /api/admin/coupons
# Danh sách mã giảm giá (tìm kiếm, lọc, phân trang)
# ════════════════════════════════════════════════════
@coupon_admin_bp.route('/coupons', methods=['GET'])
@jwt_required()
def get_coupons():
    _, err = admin_required_check()
    if err: return err

    try:
        page      = request.args.get('page',      1,    type=int)
        per_page  = request.args.get('per_page',  10,   type=int)
        search    = request.args.get('search',    '',   type=str).strip()
        is_active = request.args.get('is_active', None, type=str)  # '0','1',None

        where, params = ['1=1'], {}

        if search:
            where.append('(c.code LIKE :q OR c.description LIKE :q)')
            params['q'] = f'%{search}%'
        if is_active in ('0', '1'):
            where.append('c.is_active = :is_active')
            params['is_active'] = int(is_active)

        w = ' AND '.join(where)

        # Đếm tổng
        total = db.session.execute(
            db.text(f'SELECT COUNT(*) FROM coupons c WHERE {w}'), params
        ).scalar() or 0

        params.update({'limit': per_page, 'offset': (page - 1) * per_page})

        rows = db.session.execute(db.text(f"""
            SELECT
                c.id, c.code, c.description,
                c.discount_type, c.discount_value,
                c.max_discount, c.min_order,
                c.max_uses, c.used_count,
                c.starts_at, c.expires_at,
                c.is_active, c.created_at,
                -- Đếm số đơn hàng đã dùng coupon này
                (SELECT COUNT(*) FROM orders o WHERE o.coupon_id = c.id) AS order_count
            FROM coupons c
            WHERE {w}
            ORDER BY c.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params).fetchall()

        now = datetime.now()

        def coupon_status(row):
            """Tính trạng thái thực tế của coupon"""
            is_active   = 1 if row[11] else 0
            starts_at   = row[9]
            expires_at  = row[10]
            used_count  = row[8]
            max_uses    = row[7]

            if not is_active:
                return 'inactive'
            if starts_at and now < starts_at:
                return 'upcoming'
            if expires_at and now > expires_at:
                return 'expired'
            if max_uses > 0 and used_count >= max_uses:
                return 'exhausted'
            return 'active'

        data = [{
            'id':             r[0],
            'code':           r[1],
            'description':    r[2] or '',
            'discount_type':  r[3],
            'discount_value': float(r[4]),
            'max_discount':   int(r[5]) if r[5] else None,
            'min_order':      int(r[6]),
            'max_uses':       r[7],
            'used_count':     r[8],
            'starts_at':      r[9].strftime('%Y-%m-%d')  if r[9]  else None,
            'expires_at':     r[10].strftime('%Y-%m-%d') if r[10] else None,
            'is_active':      1 if r[11] else 0,
            'created_at':     r[12].strftime('%Y-%m-%d %H:%M') if r[12] else None,
            'order_count':    int(r[13]),
            'status':         coupon_status(r),   # active | inactive | expired | upcoming | exhausted
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
# GET /api/admin/coupons/<id>
# Chi tiết 1 mã giảm giá
# ════════════════════════════════════════════════════
@coupon_admin_bp.route('/coupons/<int:cid>', methods=['GET'])
@jwt_required()
def get_coupon(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        row = db.session.execute(db.text("""
            SELECT id, code, description, discount_type, discount_value,
                   max_discount, min_order, max_uses, used_count,
                   starts_at, expires_at, is_active, created_at
            FROM coupons WHERE id = :id
        """), {'id': cid}).fetchone()

        if not row:
            return jsonify({'success': False, 'message': 'Không tìm thấy mã giảm giá'}), 404

        return jsonify({'success': True, 'data': {
            'id':             row[0],
            'code':           row[1],
            'description':    row[2] or '',
            'discount_type':  row[3],
            'discount_value': float(row[4]),
            'max_discount':   int(row[5]) if row[5] else None,
            'min_order':      int(row[6]),
            'max_uses':       row[7],
            'used_count':     row[8],
            'starts_at':      row[9].strftime('%Y-%m-%d')  if row[9]  else '',
            'expires_at':     row[10].strftime('%Y-%m-%d') if row[10] else '',
            'is_active':      1 if row[11] else 0,
            'created_at':     row[12].strftime('%Y-%m-%d %H:%M') if row[12] else None,
        }})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# POST /api/admin/coupons
# Thêm mã giảm giá mới
# ════════════════════════════════════════════════════
@coupon_admin_bp.route('/coupons', methods=['POST'])
@jwt_required()
def create_coupon():
    _, err = admin_required_check()
    if err: return err

    try:
        body = request.get_json() or {}

        # ── Validate ─────────────────────────────────────
        code = (body.get('code') or '').strip().upper()
        if not code:
            return jsonify({'success': False, 'message': 'Mã coupon không được để trống'}), 400
        if len(code) > 50:
            return jsonify({'success': False, 'message': 'Mã coupon tối đa 50 ký tự'}), 400

        discount_type = body.get('discount_type', 'percent')
        if discount_type not in ('percent', 'fixed'):
            return jsonify({'success': False, 'message': 'Loại giảm giá không hợp lệ'}), 400

        try:
            discount_value = float(body.get('discount_value', 0))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Giá trị giảm không hợp lệ'}), 400

        if discount_value <= 0:
            return jsonify({'success': False, 'message': 'Giá trị giảm phải lớn hơn 0'}), 400
        if discount_type == 'percent' and discount_value > 100:
            return jsonify({'success': False, 'message': 'Giảm % không được vượt quá 100%'}), 400

        # ── Kiểm tra trùng code ───────────────────────────
        dup = db.session.execute(
            db.text('SELECT id FROM coupons WHERE UPPER(code) = :code'),
            {'code': code}
        ).fetchone()
        if dup:
            return jsonify({'success': False, 'message': f'Mã "{code}" đã tồn tại'}), 409

        # ── Xử lý các trường còn lại ─────────────────────
        description   = (body.get('description') or '').strip()
        max_discount  = int(body['max_discount'])  if body.get('max_discount')  else None
        min_order     = int(body.get('min_order', 0))
        max_uses      = int(body.get('max_uses', 0))
        is_active     = int(body.get('is_active', 1))
        starts_at     = body.get('starts_at')  or None
        expires_at    = body.get('expires_at') or None

        db.session.execute(db.text("""
            INSERT INTO coupons
              (code, description, discount_type, discount_value,
               max_discount, min_order, max_uses, used_count,
               starts_at, expires_at, is_active, created_at)
            VALUES
              (:code, :desc, :dtype, :dvalue,
               :max_disc, :min_order, :max_uses, 0,
               :starts_at, :expires_at, :is_active, NOW())
        """), {
            'code':       code,
            'desc':       description,
            'dtype':      discount_type,
            'dvalue':     discount_value,
            'max_disc':   max_discount,
            'min_order':  min_order,
            'max_uses':   max_uses,
            'starts_at':  starts_at,
            'expires_at': expires_at,
            'is_active':  is_active,
        })
        db.session.commit()

        new_id = db.session.execute(db.text('SELECT LAST_INSERT_ID()')).scalar()

        return jsonify({
            'success': True,
            'message': f'Đã thêm mã giảm giá "{code}" thành công',
            'data':    {'id': new_id, 'code': code}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# PUT /api/admin/coupons/<id>
# Cập nhật mã giảm giá
# ════════════════════════════════════════════════════
@coupon_admin_bp.route('/coupons/<int:cid>', methods=['PUT'])
@jwt_required()
def update_coupon(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        exists = db.session.execute(
            db.text('SELECT id, used_count FROM coupons WHERE id = :id'), {'id': cid}
        ).fetchone()
        if not exists:
            return jsonify({'success': False, 'message': 'Không tìm thấy mã giảm giá'}), 404

        body = request.get_json() or {}

        code = (body.get('code') or '').strip().upper()
        if not code:
            return jsonify({'success': False, 'message': 'Mã coupon không được để trống'}), 400

        discount_type  = body.get('discount_type', 'percent')
        discount_value = float(body.get('discount_value', 0))

        if discount_value <= 0:
            return jsonify({'success': False, 'message': 'Giá trị giảm phải lớn hơn 0'}), 400
        if discount_type == 'percent' and discount_value > 100:
            return jsonify({'success': False, 'message': 'Giảm % không được vượt quá 100%'}), 400

        # Kiểm tra trùng code (loại trừ chính nó)
        dup = db.session.execute(
            db.text('SELECT id FROM coupons WHERE UPPER(code) = :code AND id != :id'),
            {'code': code, 'id': cid}
        ).fetchone()
        if dup:
            return jsonify({'success': False, 'message': f'Mã "{code}" đã tồn tại'}), 409

        description  = (body.get('description') or '').strip()
        max_discount = int(body['max_discount'])  if body.get('max_discount')  else None
        min_order    = int(body.get('min_order', 0))
        max_uses     = int(body.get('max_uses', 0))
        is_active    = int(body.get('is_active', 1))
        starts_at    = body.get('starts_at')  or None
        expires_at   = body.get('expires_at') or None

        db.session.execute(db.text("""
            UPDATE coupons SET
                code           = :code,
                description    = :desc,
                discount_type  = :dtype,
                discount_value = :dvalue,
                max_discount   = :max_disc,
                min_order      = :min_order,
                max_uses       = :max_uses,
                starts_at      = :starts_at,
                expires_at     = :expires_at,
                is_active      = :is_active
            WHERE id = :id
        """), {
            'code':       code,
            'desc':       description,
            'dtype':      discount_type,
            'dvalue':     discount_value,
            'max_disc':   max_discount,
            'min_order':  min_order,
            'max_uses':   max_uses,
            'starts_at':  starts_at,
            'expires_at': expires_at,
            'is_active':  is_active,
            'id':         cid,
        })
        db.session.commit()

        return jsonify({'success': True, 'message': f'Đã cập nhật mã "{code}" thành công'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# PUT /api/admin/coupons/<id>/status
# Bật / tắt mã giảm giá
# ════════════════════════════════════════════════════
@coupon_admin_bp.route('/coupons/<int:cid>/status', methods=['PUT'])
@jwt_required()
def toggle_coupon_status(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        row = db.session.execute(
            db.text('SELECT id, code, is_active FROM coupons WHERE id = :id'), {'id': cid}
        ).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Không tìm thấy mã giảm giá'}), 404

        new_status = 0 if (1 if row[2] else 0) == 1 else 1
        db.session.execute(
            db.text('UPDATE coupons SET is_active = :s WHERE id = :id'),
            {'s': new_status, 'id': cid}
        )
        db.session.commit()

        action = 'kích hoạt' if new_status == 1 else 'tắt'
        return jsonify({
            'success':    True,
            'message':    f'Đã {action} mã "{row[1]}"',
            'new_status': new_status,
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# DELETE /api/admin/coupons/<id>
# Xóa mã giảm giá (chỉ khi chưa được dùng)
# ════════════════════════════════════════════════════
@coupon_admin_bp.route('/coupons/<int:cid>', methods=['DELETE'])
@jwt_required()
def delete_coupon(cid):
    _, err = admin_required_check()
    if err: return err

    try:
        row = db.session.execute(
            db.text('SELECT id, code, used_count FROM coupons WHERE id = :id'), {'id': cid}
        ).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Không tìm thấy mã giảm giá'}), 404

        # Kiểm tra đã được dùng trong đơn hàng chưa
        order_count = db.session.execute(
            db.text('SELECT COUNT(*) FROM orders WHERE coupon_id = :id'), {'id': cid}
        ).scalar()

        if order_count > 0:
            return jsonify({
                'success': False,
                'message': f'Không thể xóa! Mã "{row[1]}" đã được dùng trong {order_count} đơn hàng. Hãy tắt mã thay thế.'
            }), 400

        db.session.execute(db.text('DELETE FROM coupons WHERE id = :id'), {'id': cid})
        db.session.commit()

        return jsonify({'success': True, 'message': f'Đã xóa mã "{row[1]}" thành công'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════
# GET /api/admin/coupons/stats
# Thống kê tổng quan mã giảm giá cho dashboard
# ════════════════════════════════════════════════════
@coupon_admin_bp.route('/coupons/stats', methods=['GET'])
@jwt_required()
def get_coupon_stats():
    _, err = admin_required_check()
    if err: return err

    try:
        now = datetime.now()

        total      = db.session.execute(db.text('SELECT COUNT(*) FROM coupons')).scalar() or 0
        active     = db.session.execute(db.text(
            "SELECT COUNT(*) FROM coupons WHERE is_active=1 AND (expires_at IS NULL OR expires_at >= :now)",
        ), {'now': now}).scalar() or 0
        expired    = db.session.execute(db.text(
            "SELECT COUNT(*) FROM coupons WHERE expires_at IS NOT NULL AND expires_at < :now"
        ), {'now': now}).scalar() or 0
        total_used = db.session.execute(db.text('SELECT COALESCE(SUM(used_count),0) FROM coupons')).scalar() or 0

        return jsonify({'success': True, 'data': {
            'total':      total,
            'active':     active,
            'expired':    expired,
            'total_used': int(total_used),
        }})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500