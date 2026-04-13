from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models.user import User
import bcrypt
import re
 
auth_bp = Blueprint('auth', __name__)
 
 
def validate_email(email):
    """Kiểm tra định dạng email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
 
 
def validate_password(password):
    """Kiểm tra mật khẩu tối thiểu 8 ký tự"""
    return len(password) >= 8
 
 
# ─── ĐĂNG KÝ ────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
 
    # Lấy dữ liệu từ request
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone    = data.get('phone', '').strip()
 
    # ─ Validate dữ liệu ─
    errors = {}
 
    if not name:
        errors['name'] = 'Vui lòng nhập họ và tên'
    elif len(name) < 2:
        errors['name'] = 'Họ tên phải có ít nhất 2 ký tự'
 
    if not email:
        errors['email'] = 'Vui lòng nhập email'
    elif not validate_email(email):
        errors['email'] = 'Email không đúng định dạng'
 
    if not password:
        errors['password'] = 'Vui lòng nhập mật khẩu'
    elif not validate_password(password):
        errors['password'] = 'Mật khẩu phải có ít nhất 8 ký tự'
 
    if errors:
        return jsonify({'success': False, 'errors': errors}), 422
 
    # ─ Kiểm tra email đã tồn tại chưa ─
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({
            'success': False,
            'errors': {'email': 'Email này đã được đăng ký, vui lòng dùng email khác'}
        }), 409
 
    # ─ Mã hóa mật khẩu bằng bcrypt ─
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12))
 
    # ─ Tạo user mới ─
    new_user = User(
        name     = name,
        email    = email,
        password = hashed_pw.decode('utf-8'),
        phone    = phone or None,
        role     = 'customer',
        status   = 1
    )
 
    try:
        db.session.add(new_user)
        db.session.commit()
 
        # Tự động tạo giỏ hàng cho user mới
        from models.cart import Cart
        cart = Cart(user_id=new_user.id)
        db.session.add(cart)
        db.session.commit()
 
        return jsonify({
            'success': True,
            'message': 'Đăng ký thành công! Vui lòng đăng nhập.',
        }), 201
 
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra, vui lòng thử lại'}), 500
 
 
# ─── ĐĂNG NHẬP ──────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
 
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
 
    # ─ Validate cơ bản ─
    if not email or not password:
        return jsonify({
            'success': False,
            'message': 'Vui lòng nhập email và mật khẩu'
        }), 400
 
    # ─ Tìm user theo email ─
    user = User.query.filter_by(email=email).first()
 
    if not user:
        return jsonify({
            'success': False,
            'message': 'Email không tồn tại trong hệ thống'
        }), 404
 
    # ─ Kiểm tra tài khoản bị khóa ─
    if user.status == 0:
        return jsonify({
            'success': False,
            'message': 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        }), 403
 
    # ─ Kiểm tra mật khẩu ─
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({
            'success': False,
            'message': 'Mật khẩu không chính xác'
        }), 401
 
    # ─ Tạo JWT Token ─
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role, 'name': user.name}
    )
 
    return jsonify({
        'success': True,
        'message': 'Đăng nhập thành công!',
        'token':   access_token,
        'user':    user.to_dict()
    }), 200
 
 
# ─── LẤY THÔNG TIN USER ĐANG ĐĂNG NHẬP ──────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
 
    if not user:
        return jsonify({'success': False, 'message': 'Không tìm thấy người dùng'}), 404
 
    return jsonify({'success': True, 'user': user.to_dict()}), 200
 
 
# ─── ĐỔI MẬT KHẨU ───────────────────────────────────────────
@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id     = get_jwt_identity()
    user        = User.query.get(user_id)
    data        = request.get_json()
    old_pw      = data.get('old_password', '')
    new_pw      = data.get('new_password', '')
 
    if not bcrypt.checkpw(old_pw.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'success': False, 'message': 'Mật khẩu hiện tại không đúng'}), 400
 
    if not validate_password(new_pw):
        return jsonify({'success': False, 'message': 'Mật khẩu mới phải có ít nhất 8 ký tự'}), 422
 
    user.password = bcrypt.hashpw(new_pw.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
    db.session.commit()
    return jsonify({'success': True, 'message': 'Đổi mật khẩu thành công!'}), 200
 