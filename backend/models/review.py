from extensions import db
from datetime import datetime


class Review(db.Model):
    __tablename__ = 'reviews'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating     = db.Column(db.SmallInteger, nullable=False)
    comment    = db.Column(db.Text)
    status     = db.Column(db.SmallInteger, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('product_id', 'user_id', name='uq_review'),
        db.CheckConstraint('rating BETWEEN 1 AND 5', name='chk_rating'),
    )

    # Relationships
    product = db.relationship('Product', back_populates='reviews')
    user    = db.relationship('User',    back_populates='reviews')

    def to_dict(self):
        return {
            'id':         self.id,
            'product_id': self.product_id,
            'user_id':    self.user_id,
            'rating':     self.rating,
            'comment':    self.comment,
            'status':     self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'user_name':  self.user.name if self.user else None,
        }