# backend/controllers/product_admin_controller.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
import os
import re
import uuid

# ==================== BLUEPRINT ====================
product_admin_bp = Blueprint('product_admin', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}


def allowed_file(filename):
    """Kiểm tra định dạng file ảnh hợp lệ"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def admin_required_check():
    """Kiểm tra quyền Admin"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None, (jsonify({'success': False, 'message': 'Không có quyền Admin'}), 403)
    return get_jwt_identity(), None


def slugify(text):
    """Chuyển tên sản phẩm thành slug tiếng Việt"""
    text = text.lower()
    text = re.sub(r'[àáảãạăắặẳẵâấầẩẫậ]', 'a', text)
    text = re.sub(r'[èéẻẽẹêếềểễệ]', 'e', text)
    text = re.sub(r'[ìíỉĩị]', 'i', text)
    text = re.sub(r'[òóỏõọôốồổỗộơớờởỡợ]', 'o', text)
    text = re.sub(r'[ùúủũụưứừửữự]', 'u', text)
    text = re.sub(r'[ýỳỷỹỵ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s]+', '-', text.strip())
    return text


# ========================= QUẢN LÝ SẢN PHẨM =========================

@product_admin_bp.route('/products', methods=['GET'])
@jwt_required()
def admin_get_products():
    """Danh sách sản phẩm cho Admin (có phân trang, tìm kiếm, lọc)"""
    _, err = admin_required_check()
    if err: return err

    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id', '')
        brand_id = request.args.get('brand_id', '')
        status = request.args.get('status', '')

        offset = (page - 1) * per_page
        where, params = ['1=1'], {}

        if search:
            where.append('(p.name LIKE :q OR p.slug LIKE :q)')
            params['q'] = f'%{search}%'
        if category_id:
            where.append('p.category_id = :cat')
            params['cat'] = int(category_id)
        if brand_id:
            where.append('p.brand_id = :brand')
            params['brand'] = int(brand_id)
        if status != '':
            where.append('p.status = :status')
            params['status'] = int(status)

        w = ' AND '.join(where)
        total = db.session.execute(db.text(f"SELECT COUNT(*) FROM products p WHERE {w}"), params).scalar()

        params.update({'limit': per_page, 'offset': offset})

        rows = db.session.execute(db.text(f"""
            SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.quantity,
                   p.sold_count, p.status, p.is_featured, p.is_bestseller,
                   p.avg_rating, p.review_count, p.created_at,
                   c.name AS category_name, b.name AS brand_name,
                   COALESCE((SELECT image_url FROM product_images 
                             WHERE product_id=p.id AND is_primary=1 LIMIT 1), '') AS primary_image
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN brands b ON p.brand_id = b.id
            WHERE {w}
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT :limit OFFSET :offset
        """), params).fetchall()

        products = [{
            'id': r[0], 'name': r[1], 'slug': r[2],
            'price': int(r[3]), 
            'sale_price': int(r[4]) if r[4] else None,
            'quantity': r[5], 'sold_count': r[6],
            'status': r[7], 'is_featured': r[8], 'is_bestseller': r[9],
            'avg_rating': float(r[10]), 'review_count': r[11],
            'created_at': r[12].strftime('%Y-%m-%d %H:%M'),
            'category_name': r[13], 'brand_name': r[14], 
            'primary_image': r[15]
        } for r in rows]

        return jsonify({
            'success': True,
            'data': products,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total or 0,
                'pages': -(-total // per_page) if total else 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/products/<int:product_id>', methods=['GET'])
@jwt_required()
def admin_get_product_detail(product_id):
    """Lấy chi tiết một sản phẩm (specs + images)"""
    _, err = admin_required_check()
    if err: return err

    try:
        p = db.session.execute(db.text("""
            SELECT p.id, p.name, p.slug, p.category_id, p.brand_id,
                   p.short_desc, p.description, p.price, p.sale_price,
                   p.quantity, p.status, p.is_featured, p.is_bestseller,
                   c.name AS category_name, b.name AS brand_name
            FROM products p
            JOIN categories c ON p.category_id=c.id
            JOIN brands b ON p.brand_id=b.id
            WHERE p.id=:id
        """), {'id': product_id}).fetchone()

        if not p:
            return jsonify({'success': False, 'message': 'Không tìm thấy sản phẩm'}), 404

        # Lấy thông số kỹ thuật
        spec = db.session.execute(db.text(
            "SELECT cpu, cpu_speed, ram, ram_slots, storage, storage_slots, display, "
            "resolution, gpu, battery, os, ports, wifi, bluetooth, weight, dimensions, color, warranty "
            "FROM product_specs WHERE product_id=:id"
        ), {'id': product_id}).fetchone()

        # Lấy danh sách ảnh
        images = db.session.execute(db.text(
            "SELECT id, image_url, image_name, is_primary, sort_order "
            "FROM product_images WHERE product_id=:id ORDER BY sort_order"
        ), {'id': product_id}).fetchall()

        spec_keys = ['cpu', 'cpu_speed', 'ram', 'ram_slots', 'storage', 'storage_slots',
                     'display', 'resolution', 'gpu', 'battery', 'os', 'ports', 'wifi',
                     'bluetooth', 'weight', 'dimensions', 'color', 'warranty']

        return jsonify({'success': True, 'data': {
            'id': p[0], 'name': p[1], 'slug': p[2],
            'category_id': p[3], 'brand_id': p[4],
            'short_desc': p[5], 'description': p[6],
            'price': int(p[7]), 
            'sale_price': int(p[8]) if p[8] else None,
            'quantity': p[9], 'status': p[10],
            'is_featured': p[11], 'is_bestseller': p[12],
            'category_name': p[13], 'brand_name': p[14],
            'specs': dict(zip(spec_keys, spec)) if spec else {},
            'images': [
                {'id': i[0], 'image_url': i[1], 'image_name': i[2],
                 'is_primary': i[3], 'sort_order': i[4]} for i in images
            ]
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/products', methods=['POST'])
@jwt_required()
def admin_create_product():
    """Thêm sản phẩm mới"""
    _, err = admin_required_check()
    if err: return err

    try:
        data = request.get_json()

        # Validate bắt buộc
        required = ['name', 'category_id', 'brand_id', 'price', 'quantity']
        for field in required:
            if not data.get(field) and data.get(field) != 0:
                return jsonify({'success': False, 'message': f'Thiếu trường bắt buộc: {field}'}), 400

        # Tạo slug duy nhất
        base_slug = slugify(data['name'])
        slug = base_slug
        counter = 1
        while db.session.execute(db.text("SELECT id FROM products WHERE slug=:s"), {'s': slug}).fetchone():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Thêm sản phẩm
        result = db.session.execute(db.text("""
            INSERT INTO products 
              (category_id, brand_id, name, slug, short_desc, description,
               price, sale_price, quantity, status, is_featured, is_bestseller, created_at)
            VALUES 
              (:category_id, :brand_id, :name, :slug, :short_desc, :description,
               :price, :sale_price, :quantity, :status, :is_featured, :is_bestseller, NOW())
        """), {
            'category_id': data['category_id'],
            'brand_id': data['brand_id'],
            'name': data['name'],
            'slug': slug,
            'short_desc': data.get('short_desc', ''),
            'description': data.get('description', ''),
            'price': data['price'],
            'sale_price': data.get('sale_price') or None,
            'quantity': data['quantity'],
            'status': data.get('status', 1),
            'is_featured': data.get('is_featured', 0),
            'is_bestseller': data.get('is_bestseller', 0),
        })
        product_id = result.lastrowid

        # Thêm thông số kỹ thuật (nếu có)
        specs = data.get('specs', {})
        if specs:
            db.session.execute(db.text("""
                INSERT INTO product_specs 
                  (product_id, cpu, cpu_speed, ram, ram_slots, storage, storage_slots,
                   display, resolution, gpu, battery, os, ports, wifi, bluetooth,
                   weight, dimensions, color, warranty)
                VALUES 
                  (:product_id, :cpu, :cpu_speed, :ram, :ram_slots, :storage, :storage_slots,
                   :display, :resolution, :gpu, :battery, :os, :ports, :wifi, :bluetooth,
                   :weight, :dimensions, :color, :warranty)
            """), {
                'product_id': product_id,
                'cpu': specs.get('cpu', ''),
                'cpu_speed': specs.get('cpu_speed', ''),
                'ram': specs.get('ram', ''),
                'ram_slots': specs.get('ram_slots', ''),
                'storage': specs.get('storage', ''),
                'storage_slots': specs.get('storage_slots', ''),
                'display': specs.get('display', ''),
                'resolution': specs.get('resolution', ''),
                'gpu': specs.get('gpu', ''),
                'battery': specs.get('battery', ''),
                'os': specs.get('os', ''),
                'ports': specs.get('ports', ''),
                'wifi': specs.get('wifi', ''),
                'bluetooth': specs.get('bluetooth', ''),
                'weight': specs.get('weight') or None,
                'dimensions': specs.get('dimensions', ''),
                'color': specs.get('color', ''),
                'warranty': specs.get('warranty', ''),
            })

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Thêm sản phẩm thành công',
            'data': {'id': product_id, 'slug': slug}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def admin_update_product(product_id):
    """Cập nhật thông tin sản phẩm"""
    _, err = admin_required_check()
    if err: return err

    try:
        data = request.get_json()

        # Kiểm tra sản phẩm tồn tại
        exists = db.session.execute(db.text("SELECT id FROM products WHERE id=:id"), {'id': product_id}).fetchone()
        if not exists:
            return jsonify({'success': False, 'message': 'Không tìm thấy sản phẩm'}), 404

        # Cập nhật slug nếu tên thay đổi
        if 'name' in data:
            base_slug = slugify(data['name'])
            slug = base_slug
            counter = 1
            while True:
                conflict = db.session.execute(db.text(
                    "SELECT id FROM products WHERE slug=:s AND id != :id"
                ), {'s': slug, 'id': product_id}).fetchone()
                if not conflict:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            data['slug'] = slug

        # Cập nhật thông tin sản phẩm
        allowed = ['name', 'slug', 'category_id', 'brand_id', 'short_desc', 'description',
                   'price', 'sale_price', 'quantity', 'status', 'is_featured', 'is_bestseller']
        sets, params = [], {'id': product_id}
        for f in allowed:
            if f in data:
                sets.append(f"{f}=:{f}")
                params[f] = data[f]

        if sets:
            db.session.execute(db.text(
                f"UPDATE products SET {', '.join(sets)}, updated_at=NOW() WHERE id=:id"
            ), params)

        # Cập nhật specs
        specs = data.get('specs', {})
        if specs:
            existing_spec = db.session.execute(db.text(
                "SELECT id FROM product_specs WHERE product_id=:id"
            ), {'id': product_id}).fetchone()

            spec_fields = ['cpu','cpu_speed','ram','ram_slots','storage','storage_slots',
                           'display','resolution','gpu','battery','os','ports','wifi',
                           'bluetooth','weight','dimensions','color','warranty']
            spec_params = {'product_id': product_id}
            for f in spec_fields:
                spec_params[f] = specs.get(f, '') if f != 'weight' else (specs.get('weight') or None)

            if existing_spec:
                sets_spec = [f"{f}=:{f}" for f in spec_fields]
                db.session.execute(db.text(
                    f"UPDATE product_specs SET {', '.join(sets_spec)} WHERE product_id=:product_id"
                ), spec_params)
            else:
                db.session.execute(db.text("""
                    INSERT INTO product_specs 
                      (product_id,cpu,cpu_speed,ram,ram_slots,storage,storage_slots,
                       display,resolution,gpu,battery,os,ports,wifi,bluetooth,
                       weight,dimensions,color,warranty)
                    VALUES 
                      (:product_id,:cpu,:cpu_speed,:ram,:ram_slots,:storage,:storage_slots,
                       :display,:resolution,:gpu,:battery,:os,:ports,:wifi,:bluetooth,
                       :weight,:dimensions,:color,:warranty)
                """), spec_params)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Cập nhật sản phẩm thành công'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/products/<int:product_id>/status', methods=['PUT'])
@jwt_required()
def admin_toggle_product_status(product_id):
    """Ẩn / Hiện sản phẩm"""
    _, err = admin_required_check()
    if err: return err

    try:
        row = db.session.execute(db.text("SELECT status FROM products WHERE id=:id"), {'id': product_id}).fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Không tìm thấy sản phẩm'}), 404

        new_status = 0 if row[0] == 1 else 1
        db.session.execute(db.text(
            "UPDATE products SET status=:s, updated_at=NOW() WHERE id=:id"
        ), {'s': new_status, 'id': product_id})

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Đã ẩn sản phẩm' if new_status == 0 else 'Đã hiện sản phẩm',
            'data': {'status': new_status}
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/products/<int:product_id>/stock', methods=['PUT'])
@jwt_required()
def admin_update_stock(product_id):
    """Cập nhật số lượng tồn kho"""
    _, err = admin_required_check()
    if err: return err

    try:
        data = request.get_json()
        quantity = data.get('quantity')
        if quantity is None or int(quantity) < 0:
            return jsonify({'success': False, 'message': 'Số lượng không hợp lệ'}), 400

        exists = db.session.execute(db.text("SELECT id FROM products WHERE id=:id"), {'id': product_id}).fetchone()
        if not exists:
            return jsonify({'success': False, 'message': 'Không tìm thấy sản phẩm'}), 404

        db.session.execute(db.text(
            "UPDATE products SET quantity=:q, updated_at=NOW() WHERE id=:id"
        ), {'q': int(quantity), 'id': product_id})

        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Đã cập nhật tồn kho: {quantity} sản phẩm',
            'data': {'quantity': int(quantity)}
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_product(product_id):
    """Xóa sản phẩm (chỉ khi chưa có trong đơn hàng)"""
    _, err = admin_required_check()
    if err: return err

    try:
        exists = db.session.execute(db.text("SELECT id FROM products WHERE id=:id"), {'id': product_id}).fetchone()
        if not exists:
            return jsonify({'success': False, 'message': 'Không tìm thấy sản phẩm'}), 404

        in_orders = db.session.execute(db.text(
            "SELECT COUNT(*) FROM order_items WHERE product_id=:id"
        ), {'id': product_id}).scalar()

        if in_orders > 0:
            return jsonify({
                'success': False,
                'message': f'Không thể xóa: sản phẩm đã có trong {in_orders} đơn hàng. Hãy ẩn sản phẩm thay thế.'
            }), 400

        # Xóa dữ liệu liên quan
        db.session.execute(db.text("DELETE FROM product_specs WHERE product_id=:id"), {'id': product_id})
        db.session.execute(db.text("DELETE FROM product_images WHERE product_id=:id"), {'id': product_id})
        db.session.execute(db.text("DELETE FROM cart_items WHERE product_id=:id"), {'id': product_id})
        db.session.execute(db.text("DELETE FROM products WHERE id=:id"), {'id': product_id})

        db.session.commit()
        return jsonify({'success': True, 'message': 'Đã xóa sản phẩm thành công'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ========================= UPLOAD ẢNH =========================

@product_admin_bp.route('/products/<int:product_id>/images', methods=['POST'])
@jwt_required()
def admin_upload_image(product_id):
    """Upload ảnh cho sản phẩm"""
    _, err = admin_required_check()
    if err: return err

    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'Không có file ảnh'}), 400

        file = request.files['image']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'success': False, 'message': 'File không hợp lệ (chỉ nhận png, jpg, jpeg, webp)'}), 400

        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"product_{product_id}_{uuid.uuid4().hex[:8]}.{ext}"

        save_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'static/uploads'), 'products')
        os.makedirs(save_dir, exist_ok=True)

        file.save(os.path.join(save_dir, filename))
        image_url = f"products/{filename}"
        is_primary = int(request.form.get('is_primary', 0))

        # Nếu đặt làm ảnh chính, bỏ ảnh chính cũ
        if is_primary:
            db.session.execute(db.text(
                "UPDATE product_images SET is_primary=0 WHERE product_id=:id"
            ), {'id': product_id})

        # Lấy thứ tự ảnh cao nhất
        max_order = db.session.execute(db.text(
            "SELECT COALESCE(MAX(sort_order),0) FROM product_images WHERE product_id=:id"
        ), {'id': product_id}).scalar()

        result = db.session.execute(db.text("""
            INSERT INTO product_images (product_id, image_url, image_name, is_primary, sort_order)
            VALUES (:pid, :url, :name, :primary, :order)
        """), {
            'pid': product_id,
            'url': image_url,
            'name': filename,
            'primary': is_primary,
            'order': max_order + 1
        })

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Upload ảnh thành công',
            'data': {
                'id': result.lastrowid,
                'image_url': image_url,
                'image_name': filename,
                'is_primary': is_primary
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/products/images/<int:image_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_image(image_id):
    """Xóa ảnh sản phẩm"""
    _, err = admin_required_check()
    if err: return err

    try:
        img = db.session.execute(db.text(
            "SELECT image_url FROM product_images WHERE id=:id"
        ), {'id': image_id}).fetchone()

        if not img:
            return jsonify({'success': False, 'message': 'Không tìm thấy ảnh'}), 404

        # Xóa file vật lý
        file_path = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'static/uploads'), img[0])
        if os.path.exists(file_path):
            os.remove(file_path)

        db.session.execute(db.text("DELETE FROM product_images WHERE id=:id"), {'id': image_id})
        db.session.commit()

        return jsonify({'success': True, 'message': 'Đã xóa ảnh thành công'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ========================= DANH MỤC & THƯƠNG HIỆU =========================

@product_admin_bp.route('/categories-dropdown', methods=['GET'])
@jwt_required()
def admin_get_categories():
    """Lấy danh sách categories cho dropdown (chỉ lấy status=1)"""
    _, err = admin_required_check()
    if err: return err

    try:
        rows = db.session.execute(db.text(
            "SELECT id, name FROM categories WHERE status=1 ORDER BY name"
        )).fetchall()
        return jsonify({
            'success': True,
            'data': [{'id': r[0], 'name': r[1]} for r in rows]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@product_admin_bp.route('/brands', methods=['GET'])
@jwt_required()
def admin_get_brands():
    """Lấy danh sách brands cho dropdown"""
    _, err = admin_required_check()
    if err: return err

    try:
        rows = db.session.execute(db.text(
            "SELECT id, name FROM brands WHERE status=1 ORDER BY name"
        )).fetchall()
        return jsonify({
            'success': True,
            'data': [{'id': r[0], 'name': r[1]} for r in rows]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500