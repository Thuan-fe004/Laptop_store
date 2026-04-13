# backend/models/user.py
from extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'

    id         = db.Column(db.Integer,      primary_key=True)
    name       = db.Column(db.String(100),  nullable=False)
    email      = db.Column(db.String(150),  nullable=False, unique=True)
    password   = db.Column(db.String(255),  nullable=False)
    phone      = db.Column(db.String(15))
    address    = db.Column(db.Text)
    avatar     = db.Column(db.String(500))
    role       = db.Column(db.Enum('admin', 'customer'), nullable=False, default='customer')
    status     = db.Column(db.SmallInteger, nullable=False, default=1)
    created_at = db.Column(db.DateTime,     default=datetime.utcnow)
    updated_at = db.Column(db.DateTime,     onupdate=datetime.utcnow)

    # ── Relationships ───────────────────────────────────────────────
    # cart.py    → Cart.user      back_populates='user'
    cart    = db.relationship('Cart',   back_populates='user',   uselist=False)

    # order.py   → Order.user     back_populates='orders'
    orders  = db.relationship('Order',  back_populates='user',   lazy='dynamic')

    # review.py  → Review.user    back_populates='reviews'
    reviews = db.relationship('Review', back_populates='user',   lazy='dynamic')

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'phone':      self.phone,
            'address':    self.address,
            'avatar':     self.avatar,
            'role':       self.role,
            'status':     self.status,
            'created_at': str(self.created_at),
        }