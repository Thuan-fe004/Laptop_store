import os
from datetime import datetime
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config

# Import extensions
from extensions import db, jwt


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # ====================== KHỞI TẠO EXTENSIONS ======================
    db.init_app(app)
    jwt.init_app(app)

    # ====================== CORS (CẢI THIỆN) ======================
    CORS(app, resources={r"/*": {   # Cho phép tất cả routes
        "origins": [
            "http://localhost:5173",           # Dev React
            "https://laptopstore-ten.vercel.app",  # Production Vercel
            "https://*.vercel.app"             # Tất cả vercel subdomains
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True,
        "max_age": 3600
    }})

    # Tạo thư mục upload
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # ====================== BLUEPRINTS ======================
    from controllers.auth_controller import auth_bp
    from controllers.product_controller import product_bp
    from controllers.cart_controller import cart_bp
    from controllers.order_controller import order_bp
    from controllers.admin_controller import admin_bp
    from controllers.product_admin_controller import product_admin_bp
    from controllers.user_admin_controller import user_admin_controller_bp
    from controllers.category_admin_controller import category_admin_bp 
    from controllers.coupon_admin_controller import coupon_admin_bp
    from controllers.order_admin_controller import order_admin_bp
    from controllers.review_controller import review_bp
    from routes.chat_routes import chat_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(product_bp, url_prefix='/api')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(order_bp, url_prefix='/api/orders')
    app.register_blueprint(review_bp, url_prefix='/api')
    app.register_blueprint(chat_bp)

    # Admin blueprints
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(product_admin_bp, url_prefix='/api/admin')
    app.register_blueprint(user_admin_bp, url_prefix='/api/admin')
    app.register_blueprint(category_admin_bp, url_prefix='/api/admin')
    app.register_blueprint(coupon_admin_bp, url_prefix='/api/admin')
    app.register_blueprint(order_admin_bp, url_prefix='/api/admin')

    # ====================== ROUTES CHÍNH ======================

    @app.route('/')
    def home():
        return jsonify({
            "success": True,
            "message": "🚀 Laptop Store Backend is running successfully!",
            "version": "1.0.0",
            "frontend": "https://laptopstore-ten.vercel.app",
            "health_check": "/api/health",
            "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "documentation": "Các API có sẵn ở /api/..."
        })

    @app.route('/api/health')
    def health():
        return jsonify({
            'success': True,
            'status': 'ok',
            'message': 'Flask server is healthy!',
            'database': 'Connected' if db.engine else 'Not checked'
        })

    # Serve static uploads
    @app.route('/static/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # ====================== FALLBACK ROUTE ======================
    @app.route('/<path:path>')
    def catch_all(path):
        """Xử lý tất cả các route không tồn tại"""
        return jsonify({
            "success": False,
            "message": "Endpoint không tồn tại",
            "path": f"/{path}",
            "available": [" / ", "/api/health", "/api/products", ...]
        }), 404

    # ====================== JWT ERROR HANDLERS ======================
    @jwt.unauthorized_loader
    def unauthorized(reason):
        return jsonify({'success': False, 'message': 'Chưa đăng nhập'}), 401

    @jwt.expired_token_loader
    def expired(jwt_header, jwt_data):
        return jsonify({'success': False, 'message': 'Phiên đăng nhập đã hết hạn'}), 401

    @jwt.invalid_token_loader
    def invalid(reason):
        return jsonify({'success': False, 'message': 'Token không hợp lệ'}), 401

    return app


# ==================== Export app cho Gunicorn / Railway ====================
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)