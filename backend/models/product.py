from extensions import db
from datetime import datetime


class Category(db.Model):
    __tablename__ = 'categories'

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name        = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    status      = db.Column(db.SmallInteger, nullable=False, default=1)
    created_at  = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    products = db.relationship('Product', back_populates='category')

    def to_dict(self):
        return {
            'id':          self.id,
            'name':        self.name,
            'description': self.description,
            'status':      self.status,
            'created_at':  self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
        }


class Brand(db.Model):
    __tablename__ = 'brands'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name       = db.Column(db.String(100), nullable=False, unique=True)
    logo       = db.Column(db.String(500))
    status     = db.Column(db.SmallInteger, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    products = db.relationship('Product', back_populates='brand')

    def to_dict(self):
        return {
            'id':     self.id,
            'name':   self.name,
            'logo':   self.logo,
            'status': self.status,
        }


class Product(db.Model):
    __tablename__ = 'products'

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id   = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    brand_id      = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    name          = db.Column(db.String(200), nullable=False)
    slug          = db.Column(db.String(200), nullable=False, unique=True)
    short_desc    = db.Column(db.Text)
    description   = db.Column(db.Text)
    price         = db.Column(db.Numeric(15, 0), nullable=False)
    sale_price    = db.Column(db.Numeric(15, 0))
    quantity      = db.Column(db.Integer, nullable=False, default=0)
    sold_count    = db.Column(db.Integer, nullable=False, default=0)
    status        = db.Column(db.SmallInteger, nullable=False, default=1)
    is_featured   = db.Column(db.SmallInteger, nullable=False, default=0)
    is_bestseller = db.Column(db.SmallInteger, nullable=False, default=0)
    avg_rating    = db.Column(db.Numeric(3, 2), nullable=False, default=0.00)
    review_count  = db.Column(db.Integer, nullable=False, default=0)
    created_at    = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Relationships
    category = db.relationship('Category', back_populates='products')
    brand    = db.relationship('Brand',    back_populates='products')
    images   = db.relationship('ProductImage', back_populates='product',
                               cascade='all, delete-orphan', order_by='ProductImage.sort_order')
    specs    = db.relationship('ProductSpec',  back_populates='product',
                               cascade='all, delete-orphan', uselist=False)
    reviews  = db.relationship('Review', back_populates='product')

    def primary_image(self):
        for img in self.images:
            if img.is_primary:
                return img.image_url
        return self.images[0].image_url if self.images else None

    def to_dict(self):
        return {
            'id':            self.id,
            'category_id':   self.category_id,
            'brand_id':      self.brand_id,
            'name':          self.name,
            'slug':          self.slug,
            'short_desc':    self.short_desc,
            'description':   self.description,
            'price':         int(self.price),
            'sale_price':    int(self.sale_price) if self.sale_price else None,
            'quantity':      self.quantity,
            'sold_count':    self.sold_count,
            'status':        self.status,
            'is_featured':   self.is_featured,
            'is_bestseller': self.is_bestseller,
            'avg_rating':    float(self.avg_rating),
            'review_count':  self.review_count,
            'primary_image': self.primary_image(),
            'category_name': self.category.name if self.category else None,
            'brand_name':    self.brand.name if self.brand else None,
            'created_at':    self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
        }

    def __repr__(self):
        return f'<Product {self.name}>'


class ProductImage(db.Model):
    __tablename__ = 'product_images'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    image_url  = db.Column(db.String(500), nullable=False)
    image_name = db.Column(db.String(200))
    is_primary = db.Column(db.SmallInteger, nullable=False, default=0)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    product = db.relationship('Product', back_populates='images')

    def to_dict(self):
        return {
            'id':         self.id,
            'image_url':  self.image_url,
            'image_name': self.image_name,
            'is_primary': self.is_primary,
            'sort_order': self.sort_order,
        }


class ProductSpec(db.Model):
    __tablename__ = 'product_specs'

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id    = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'),
                              nullable=False, unique=True)
    cpu           = db.Column(db.String(200))
    cpu_speed     = db.Column(db.String(50))
    ram           = db.Column(db.String(50))
    ram_slots     = db.Column(db.String(50))
    storage       = db.Column(db.String(100))
    storage_slots = db.Column(db.String(50))
    display       = db.Column(db.String(100))
    resolution    = db.Column(db.String(50))
    gpu           = db.Column(db.String(200))
    battery       = db.Column(db.String(100))
    os            = db.Column(db.String(100))
    ports         = db.Column(db.Text)
    wifi          = db.Column(db.String(100))
    bluetooth     = db.Column(db.String(50))
    weight        = db.Column(db.Numeric(4, 2))
    dimensions    = db.Column(db.String(100))
    color         = db.Column(db.String(100))
    warranty      = db.Column(db.String(50))

    product = db.relationship('Product', back_populates='specs')

    def to_dict(self):
        return {
            'cpu':           self.cpu,
            'cpu_speed':     self.cpu_speed,
            'ram':           self.ram,
            'ram_slots':     self.ram_slots,
            'storage':       self.storage,
            'storage_slots': self.storage_slots,
            'display':       self.display,
            'resolution':    self.resolution,
            'gpu':           self.gpu,
            'battery':       self.battery,
            'os':            self.os,
            'ports':         self.ports,
            'wifi':          self.wifi,
            'bluetooth':     self.bluetooth,
            'weight':        float(self.weight) if self.weight else None,
            'dimensions':    self.dimensions,
            'color':         self.color,
            'warranty':      self.warranty,
        }