# backend/controllers/product_controller.py
from flask import Blueprint, jsonify, request
from extensions import db

product_bp = Blueprint('product', __name__)


# ══════════════════════════════════════════════════════════
# GET /api/products
# Query params: is_featured, is_bestseller, category_id,
#               brand_id, search, sort, page, per_page
# ══════════════════════════════════════════════════════════
@product_bp.route('/products', methods=['GET'])
def get_products():
    try:
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))
        offset   = (page - 1) * per_page

        where  = ['p.status = 1']
        params = {}

        # ── Filters ──────────────────────────────────────
        if request.args.get('is_featured'):
            where.append('p.is_featured = 1')

        if request.args.get('is_bestseller'):
            where.append('p.is_bestseller = 1')

        if request.args.get('category_id'):
            where.append('p.category_id = :category_id')
            params['category_id'] = int(request.args.get('category_id'))

        if request.args.get('brand_id'):
            where.append('p.brand_id = :brand_id')
            params['brand_id'] = int(request.args.get('brand_id'))

        if request.args.get('search'):
            where.append('p.name LIKE :search')
            params['search'] = f"%{request.args.get('search')}%"

        if request.args.get('min_price'):
            where.append('COALESCE(p.sale_price, p.price) >= :min_price')
            params['min_price'] = float(request.args.get('min_price'))

        if request.args.get('max_price'):
            where.append('COALESCE(p.sale_price, p.price) <= :max_price')
            params['max_price'] = float(request.args.get('max_price'))

        # ── Sort ──────────────────────────────────────────
        sort_map = {
            'price_asc':  'COALESCE(p.sale_price, p.price) ASC',
            'price_desc': 'COALESCE(p.sale_price, p.price) DESC',
            'newest':     'p.created_at DESC',
            'rating':     'p.avg_rating DESC',
            'bestseller': 'p.sold_count DESC',
        }
        order_by = sort_map.get(request.args.get('sort', ''), 'p.created_at DESC')
        where_sql = ' AND '.join(where)

        # ── Đếm tổng ─────────────────────────────────────
        count_sql = f"SELECT COUNT(*) FROM products p WHERE {where_sql}"
        total = db.session.execute(db.text(count_sql), params).scalar()

        # ── Lấy dữ liệu ──────────────────────────────────
        params['limit']  = per_page
        params['offset'] = offset

        sql = f"""
            SELECT
                p.id, p.name, p.slug, p.short_desc,
                p.price, p.sale_price, p.quantity, p.sold_count,
                p.is_featured, p.is_bestseller,
                p.avg_rating, p.review_count,
                c.name  AS category_name, c.id AS category_id,
                b.name  AS brand_name,   b.id AS brand_id,
                pi.image_url AS primary_image
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN brands     b ON p.brand_id    = b.id
            LEFT JOIN product_images pi
                   ON p.id = pi.product_id AND pi.is_primary = 1
            WHERE {where_sql}
            ORDER BY {order_by}
            LIMIT :limit OFFSET :offset
        """
        rows = db.session.execute(db.text(sql), params).fetchall()

        products = []
        for r in rows:
            products.append({
                'id':            r[0],
                'name':          r[1],
                'slug':          r[2],
                'short_desc':    r[3],
                'price':         float(r[4]),
                'sale_price':    float(r[5]) if r[5] else None,
                'quantity':      r[6],
                'sold_count':    r[7],
                'is_featured':   r[8],
                'is_bestseller': r[9],
                'avg_rating':    float(r[10]),
                'review_count':  r[11],
                'category_name': r[12],
                'category_id':   r[13],
                'brand_name':    r[14],
                'brand_id':      r[15],
                'primary_image': r[16],
            })

        return jsonify({
            'success': True,
            'data': products,
            'pagination': {
                'page':        page,
                'per_page':    per_page,
                'total':       total,
                'total_pages': -(-total // per_page),
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════
# GET /api/products/<slug>  — Chi tiết sản phẩm
# ══════════════════════════════════════════════════════════
@product_bp.route('/products/<slug>', methods=['GET'])
def get_product_detail(slug):
    try:
        sql = """
            SELECT
                p.id, p.name, p.slug, p.short_desc, p.description,
                p.price, p.sale_price, p.quantity, p.sold_count,
                p.is_featured, p.is_bestseller, p.avg_rating, p.review_count,
                c.name AS category_name, c.id AS category_id,
                b.name AS brand_name,   b.id AS brand_id
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN brands     b ON p.brand_id    = b.id
            WHERE p.slug = :slug AND p.status = 1
        """
        r = db.session.execute(db.text(sql), {'slug': slug}).fetchone()
        if not r:
            return jsonify({'success': False, 'message': 'Không tìm thấy sản phẩm'}), 404

        product = {
            'id': r[0], 'name': r[1], 'slug': r[2],
            'short_desc': r[3], 'description': r[4],
            'price': float(r[5]), 'sale_price': float(r[6]) if r[6] else None,
            'quantity': r[7], 'sold_count': r[8],
            'is_featured': r[9], 'is_bestseller': r[10],
            'avg_rating': float(r[11]), 'review_count': r[12],
            'category_name': r[13], 'category_id': r[14],
            'brand_name': r[15], 'brand_id': r[16],
        }

        # Ảnh
        imgs = db.session.execute(db.text(
            "SELECT image_url, image_name, is_primary FROM product_images "
            "WHERE product_id=:id ORDER BY sort_order"
        ), {'id': product['id']}).fetchall()
        product['images'] = [{'url': i[0], 'name': i[1], 'is_primary': i[2]} for i in imgs]

        # Specs
        spec = db.session.execute(db.text(
            "SELECT * FROM product_specs WHERE product_id=:id"
        ), {'id': product['id']}).fetchone()
        if spec:
            keys = ['id','product_id','cpu','cpu_speed','ram','ram_slots',
                    'storage','storage_slots','display','resolution','gpu',
                    'battery','os','ports','wifi','bluetooth',
                    'weight','dimensions','color','warranty']
            product['specs'] = dict(zip(keys, spec))
        else:
            product['specs'] = {}

        # Reviews
        reviews = db.session.execute(db.text("""
            SELECT r.id, r.rating, r.comment, r.created_at,
                   u.name AS user_name, u.avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = :id AND r.status = 1
            ORDER BY r.created_at DESC
            LIMIT 10
        """), {'id': product['id']}).fetchall()
        product['reviews'] = [{
            'id': rv[0], 'rating': rv[1], 'comment': rv[2],
            'created_at': str(rv[3]), 'user_name': rv[4], 'avatar': rv[5],
        } for rv in reviews]

        # Sản phẩm liên quan (cùng category)
        related = db.session.execute(db.text("""
            SELECT p.id, p.name, p.slug, p.price, p.sale_price,
                   p.avg_rating, p.review_count, p.is_bestseller,
                   b.name AS brand_name, pi.image_url AS primary_image
            FROM products p
            JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
            WHERE p.category_id = :cat_id AND p.id != :prod_id AND p.status = 1
            ORDER BY p.sold_count DESC
            LIMIT 4
        """), {'cat_id': product['category_id'], 'prod_id': product['id']}).fetchall()
        product['related'] = [{
            'id': rp[0], 'name': rp[1], 'slug': rp[2],
            'price': float(rp[3]), 'sale_price': float(rp[4]) if rp[4] else None,
            'avg_rating': float(rp[5]), 'review_count': rp[6],
            'is_bestseller': rp[7], 'brand_name': rp[8], 'primary_image': rp[9],
        } for rp in related]

        return jsonify({'success': True, 'data': product})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════
# GET /api/categories
# ══════════════════════════════════════════════════════════
@product_bp.route('/categories', methods=['GET'])
def get_categories_public():
    try:
        rows = db.session.execute(db.text(
            "SELECT id, name, description, status FROM categories "
            "WHERE status=1 ORDER BY name"
        )).fetchall()
        return jsonify({
            'success': True,
            'data': [{'id': r[0], 'name': r[1], 'description': r[2], 'status': r[3]} for r in rows]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════
# GET /api/brands
# ══════════════════════════════════════════════════════════
@product_bp.route('/brands', methods=['GET'])
def get_brands_public():
    try:
        rows = db.session.execute(db.text(
            "SELECT id, name, logo, status FROM brands "
            "WHERE status=1 ORDER BY name"
        )).fetchall()
        return jsonify({
            'success': True,
            'data': [{'id': r[0], 'name': r[1], 'logo': r[2], 'status': r[3]} for r in rows]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500