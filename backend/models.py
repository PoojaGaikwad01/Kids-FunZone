from datetime import datetime, date
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class AdminUser(db.Model):
    __tablename__ = "admin_users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(120), nullable=False, default="")
    last_name = db.Column(db.String(120), nullable=False, default="")
    phone = db.Column(db.String(30), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    children = db.relationship("Child", backref="parent", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "phone": self.phone,
        }


class Child(db.Model):
    __tablename__ = "children"

    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    first_name = db.Column(db.String(120), nullable=False, default="")
    last_name = db.Column(db.String(120), nullable=False, default="")
    dob = db.Column(db.Date, nullable=True)


class Birthday(db.Model):
    __tablename__ = "birthdays"

    id = db.Column(db.Integer, primary_key=True)
    child_name = db.Column(db.String(255), nullable=False)
    parent_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    child_age = db.Column(db.Integer, nullable=True)
    date = db.Column(db.String(30), nullable=False)
    time_slot = db.Column(db.String(60), nullable=False)
    package = db.Column(db.String(30), nullable=False)
    guests = db.Column(db.Integer, nullable=False, default=50)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), nullable=False, default="Booked")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "childName": self.child_name,
            "parentName": self.parent_name,
            "phone": self.phone,
            "childAge": self.child_age,
            "date": self.date,
            "timeSlot": self.time_slot,
            "package": self.package,
            "guests": self.guests,
            "amount": float(self.amount),
            "notes": self.notes,
            "status": self.status,
        }


class Membership(db.Model):
    __tablename__ = "memberships"

    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    child_name = db.Column(db.String(255), nullable=True)
    type = db.Column(db.String(60), nullable=False)
    start_date = db.Column(db.String(30), nullable=False)
    end_date = db.Column(db.String(30), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="Active")
    hidden = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "customerName": self.customer_name,
            "phone": self.phone,
            "childName": self.child_name,
            "type": self.type,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "price": float(self.price),
            "status": self.status,
            "hidden": self.hidden,
        }
