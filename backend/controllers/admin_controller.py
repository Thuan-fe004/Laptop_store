from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
# ✅ SỬA: dùng extensions.db thay vì app.db (giống auth_controller.py của bạn)
from extensions import db
from datetime import datetime

admin_bp = Blueprint('admin', __name__)


# ─────────────────────────────────────────
# HELPER: Kiểm tra quyền Admin
# ─────────────────────────────────────────
def admin_required_check():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None, (jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403)
    return get_jwt_identity(), None


# ─────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────
@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id, err = admin_required_check()
    if err: return err
    try:
        revenue = db.session.execute(db.text(
            "SELECT COALESCE(SUM(final_price),0) FROM orders WHERE status='delivered'"
        )).scalar()

        first_day = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        revenue_month = db.session.execute(db.text(
            "SELECT COALESCE(SUM(final_price),0) FROM orders "
            "WHERE status='delivered' AND created_at >= :d"
        ), {'d': first_day}).scalar()

        rows = db.session.execute(db.text(
            "SELECT status, COUNT(*) FROM orders GROUP BY status"
        )).fetchall()
        status_map = {r[0]: r[1] for r in rows}

        total_products = db.session.execute(db.text(
            "SELECT COUNT(*) FROM products WHERE status=1"
        )).scalar()
        low_stock = db.session.execute(db.text(
            "SELECT COUNT(*) FROM products WHERE quantity<=5 AND status=1"
        )).scalar()

        total_users = db.session.execute(db.text(
            "SELECT COUNT(*) FROM users WHERE role='customer'"
        )).scalar()
        new_users = db.session.execute(db.text(
            "SELECT COUNT(*) FROM users WHERE role='customer' AND created_at>=:d"
        ), {'d': first_day}).scalar()

        return jsonify({
            'success': True,
            'data': {
                'revenue': {'total': int(revenue), 'this_month': int(revenue_month)},
                'orders': {
                    'total':      sum(status_map.values()),
                    'pending':    status_map.get('pending', 0),
                    'processing': status_map.get('processing', 0),
                    'shipping':   status_map.get('shipping', 0),
                    'delivered':  status_map.get('delivered', 0),
                    'cancelled':  status_map.get('cancelled', 0),
                },
                'products': {'total': total_products, 'low_stock': low_stock},
                'users':    {'total': total_users, 'new_this_month': new_users},
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/dashboard/revenue-chart', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    _, err = admin_required_check()
    if err: return err
    try:
        rows = db.session.execute(db.text("""
            SELECT DATE_FORMAT(created_at,'%Y-%m') AS month,
                   COUNT(*) AS orders,
                   COALESCE(SUM(final_price),0) AS revenue
            FROM orders
            WHERE status='delivered'
              AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month ORDER BY month
        """)).fetchall()
        return jsonify({'success': True, 'data': [
            {'month': r[0], 'orders': r[1], 'revenue': int(r[2])} for r in rows
        ]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/dashboard/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    _, err = admin_required_check()
    if err: return err
    try:
        rows = db.session.execute(db.text("""
            SELECT p.id, p.name,
                   COALESCE((SELECT image_url FROM product_images
                              WHERE product_id=p.id AND is_primary=1 LIMIT 1),'') AS image,
                   SUM(oi.quantity) AS sold_qty,
                   SUM(oi.subtotal) AS revenue
            FROM order_items oi
            JOIN products p ON oi.product_id=p.id
            JOIN orders o ON oi.order_id=o.id
            WHERE o.status='delivered'
            GROUP BY p.id, p.name
            ORDER BY sold_qty DESC LIMIT 5
        """)).fetchall()
        return jsonify({'success': True, 'data': [
            {'id': r[0], 'name': r[1], 'image': r[2], 'sold_qty': r[3], 'revenue': int(r[4])}
            for r in rows
        ]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/dashboard/recent-orders', methods=['GET'])
@jwt_required()
def get_recent_orders():
    _, err = admin_required_check()
    if err: return err
    try:
        rows = db.session.execute(db.text("""
            SELECT o.id, o.order_code, u.name,
                   o.final_price, o.status,
                   o.payment_method, o.payment_status, o.created_at
            FROM orders o JOIN users u ON o.user_id=u.id
            ORDER BY o.created_at DESC LIMIT 10
        """)).fetchall()
        return jsonify({'success': True, 'data': [{
            'id': r[0], 'order_code': r[1], 'customer_name': r[2],
            'final_price': int(r[3]), 'status': r[4],
            'payment_method': r[5], 'payment_status': r[6],
            'created_at': r[7].strftime('%Y-%m-%d %H:%M')
        } for r in rows]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


