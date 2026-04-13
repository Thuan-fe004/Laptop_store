# models/__init__.py
# Import tất cả models để SQLAlchemy nhận diện khi db.create_all()

from .user    import User
from .product import Category, Brand, Product, ProductImage, ProductSpec
from .cart    import Cart, CartItem
from .order   import Coupon, Order, OrderItem, ShippingInfo
from .review  import Review

__all__ = [
    'User',
    'Category', 'Brand', 'Product', 'ProductImage', 'ProductSpec',
    'Cart', 'CartItem',
    'Coupon', 'Order', 'OrderItem', 'ShippingInfo',
    'Review',
]