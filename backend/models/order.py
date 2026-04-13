from extensions import db
from datetime import datetime


class Coupon(db.Model):
    __tablename__ = 'coupons'

    id             = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code           = db.Column(db.String(50), nullable=False, unique=True)
    description    = db.Column(db.String(200))
    discount_type  = db.Column(db.Enum('percent', 'fixed'), nullable=False, default='percent')
    discount_value = db.Column(db.Numeric(10, 2), nullable=False)
    max_discount   = db.Column(db.Numeric(15, 0))
    min_order      = db.Column(db.Numeric(15, 0), nullable=False, default=0)
    max_uses       = db.Column(db.Integer, nullable=False, default=0)
    used_count     = db.Column(db.Integer, nullable=False, default=0)
    starts_at      = db.Column(db.DateTime)
    expires_at     = db.Column(db.DateTime)
    is_active      = db.Column(db.SmallInteger, nullable=False, default=1)
    created_at     = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    orders = db.relationship('Order', back_populates='coupon')

    def to_dict(self):
        return {
            'id':             self.id,
            'code':           self.code,
            'description':    self.description,
            'discount_type':  self.discount_type,
            'discount_value': float(self.discount_value),
            'max_discount':   int(self.max_discount) if self.max_discount else None,
            'min_order':      int(self.min_order),
            'max_uses':       self.max_uses,
            'used_count':     self.used_count,
            'starts_at':      self.starts_at.strftime('%Y-%m-%d') if self.starts_at else None,
            'expires_at':     self.expires_at.strftime('%Y-%m-%d') if self.expires_at else None,
            'is_active':      self.is_active,
        }


class Order(db.Model):
    __tablename__ = 'orders'

    id               = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_code       = db.Column(db.String(20), nullable=False, unique=True)
    user_id          = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    coupon_id        = db.Column(db.Integer, db.ForeignKey('coupons.id'))
    total_price      = db.Column(db.Numeric(15, 0), nullable=False)
    discount         = db.Column(db.Numeric(15, 0), nullable=False, default=0)
    shipping_fee     = db.Column(db.Numeric(15, 0), nullable=False, default=0)
    final_price      = db.Column(db.Numeric(15, 0), nullable=False)
    status           = db.Column(
                           db.Enum('pending', 'processing', 'shipping', 'delivered', 'cancelled'),
                           nullable=False, default='pending')
    payment_method   = db.Column(db.String(50), nullable=False, default='cod')
    payment_status   = db.Column(db.Enum('unpaid', 'paid', 'refunded'), nullable=False, default='unpaid')
    note             = db.Column(db.Text)
    cancelled_reason = db.Column(db.Text)
    created_at       = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Relationships
    user          = db.relationship('User',         back_populates='orders')
    coupon        = db.relationship('Coupon',        back_populates='orders')
    items         = db.relationship('OrderItem',     back_populates='order',
                                    cascade='all, delete-orphan')
    shipping_info = db.relationship('ShippingInfo',  back_populates='order',
                                    uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':               self.id,
            'order_code':       self.order_code,
            'user_id':          self.user_id,
            'total_price':      int(self.total_price),
            'discount':         int(self.discount),
            'shipping_fee':     int(self.shipping_fee),
            'final_price':      int(self.final_price),
            'status':           self.status,
            'payment_method':   self.payment_method,
            'payment_status':   self.payment_status,
            'note':             self.note,
            'cancelled_reason': self.cancelled_reason,
            'created_at':       self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'items':            [i.to_dict() for i in self.items],
            'shipping_info':    self.shipping_info.to_dict() if self.shipping_info else None,
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id      = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id    = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    product_name  = db.Column(db.String(200), nullable=False)
    product_image = db.Column(db.String(500))
    quantity      = db.Column(db.Integer, nullable=False)
    unit_price    = db.Column(db.Numeric(15, 0), nullable=False)
    subtotal      = db.Column(db.Numeric(15, 0), nullable=False)

    # Relationships
    order   = db.relationship('Order',   back_populates='items')
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id':            self.id,
            'product_id':    self.product_id,
            'product_name':  self.product_name,
            'product_image': self.product_image,
            'quantity':      self.quantity,
            'unit_price':    int(self.unit_price),
            'subtotal':      int(self.subtotal),
        }


class ShippingInfo(db.Model):
    __tablename__ = 'shipping_info'

    id             = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id       = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'),
                               nullable=False, unique=True)
    receiver_name  = db.Column(db.String(100), nullable=False)
    receiver_phone = db.Column(db.String(15), nullable=False)
    address        = db.Column(db.Text, nullable=False)
    ward           = db.Column(db.String(100))
    district       = db.Column(db.String(100), nullable=False)
    province       = db.Column(db.String(100), nullable=False)
    postal_code    = db.Column(db.String(10))
    note           = db.Column(db.Text)

    order = db.relationship('Order', back_populates='shipping_info')

    def to_dict(self):
        return {
            'receiver_name':  self.receiver_name,
            'receiver_phone': self.receiver_phone,
            'address':        self.address,
            'ward':           self.ward,
            'district':       self.district,
            'province':       self.province,
            'postal_code':    self.postal_code,
        }