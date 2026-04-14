import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from flask import send_from_directory
# Import extensions từ file riêng
from extensions import db, jwt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Khởi tạo extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:5173"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

    # Tạo thư mục upload
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Đăng ký Blueprints
    from controllers.auth_controller import auth_bp
    from controllers.product_controller import product_bp
    from controllers.cart_controller import cart_bp
    from controllers.order_controller import order_bp
    from controllers.admin_controller import admin_bp
    from controllers.product_admin_controller import product_admin_bp
    from controllers.user_admin_controller import user_admin_bp
    from controllers.category_admin_controller import category_admin_bp 
    from controllers.coupon_admin_controller import coupon_admin_bp
    from controllers.order_admin_controller    import order_admin_bp
    from controllers.review_controller import review_bp
    from routes.chat_routes import chat_bp
    

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(product_bp, url_prefix='/api')
    
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(product_admin_bp, url_prefix='/api/admin')
    app.register_blueprint(user_admin_bp, url_prefix='/api/admin')
    app.register_blueprint(category_admin_bp,  url_prefix='/api/admin')
    app.register_blueprint(coupon_admin_bp, url_prefix='/api/admin')
    app.register_blueprint(order_admin_bp,     url_prefix='/api/admin')
    app.register_blueprint(cart_bp,  url_prefix='/api/cart')
    app.register_blueprint(order_bp, url_prefix='/api/orders')
    app.register_blueprint(review_bp, url_prefix='/api')
    app.register_blueprint(chat_bp)


    @app.route('/static/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    # Route health check
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'message': 'Flask server is running!'})

    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized(reason):
        return jsonify({'success': False, 'message': 'Chưa đăng nhập'}), 401

    @jwt.expired_token_loader
    def expired(jwt_header, jwt_data):
        return jsonify({'success': False, 'message': 'Phiên đăng nhập đã hết hạn'}), 401

    @jwt.invalid_token_loader
    def invalid(reason):
        return jsonify({'success': False, 'message': 'Token không hợp lệ'}), 401

    # Tạo database tables (chỉ chạy lần đầu)
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)