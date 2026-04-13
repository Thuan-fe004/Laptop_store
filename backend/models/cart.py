from extensions import db
from datetime import datetime


class Cart(db.Model):
    __tablename__ = 'carts'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Relationships
    user  = db.relationship('User', back_populates='cart')
    items = db.relationship('CartItem', back_populates='cart',
                            cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':      self.id,
            'user_id': self.user_id,
            'items':   [item.to_dict() for item in self.items],
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cart_id    = db.Column(db.Integer, db.ForeignKey('carts.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity   = db.Column(db.Integer, nullable=False, default=1)
    added_at   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('cart_id', 'product_id', name='uq_cart_product'),
    )

    # Relationships
    cart    = db.relationship('Cart',    back_populates='items')
    product = db.relationship('Product')

    def to_dict(self):
        p = self.product
        return {
            'id':          self.id,
            'product_id':  self.product_id,
            'quantity':    self.quantity,
            'product': {
                'id':          p.id,
                'name':        p.name,
                'price':       int(p.price),
                'sale_price':  int(p.sale_price) if p.sale_price else None,
                'image':       p.primary_image(),
                'quantity':    p.quantity,   # tồn kho để check stock
                'status':      p.status,
            } if p else None,
        }