from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config, ROOT_DIR
from models import db, AdminUser, Customer, Child, Birthday, Membership

BIRTHDAY_PACKAGES = {"Silver": 14999, "Gold": 24999, "Platinum": 39999}
MEMBERSHIP_PLANS = {
    "5 Hours Pass": {"price": 1250, "days": 15},
    "10 Hours Pass": {"price": 2400, "days": 20},
    "15 Hours Pass": {"price": 3500, "days": 25},
    "30 Hours Pass": {"price": 6600, "days": 45},
}

app = Flask(__name__, static_folder=str(ROOT_DIR), static_url_path="")
app.config.from_object(Config)
db.init_app(app)


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin_id"):
            return jsonify({"error": "Authentication required"}), 401
        return fn(*args, **kwargs)

    return wrapper


def split_name(full_name):
    parts = (full_name or "").strip().split(None, 1)
    first = parts[0] if parts else ""
    last = parts[1] if len(parts) > 1 else ""
    return first, last


def find_or_create_customer(phone, full_name):
    phone = (phone or "").strip()
    customer = Customer.query.filter_by(phone=phone).first() if phone else None
    if customer:
        return customer
    first, last = split_name(full_name)
    customer = Customer(first_name=first, last_name=last, phone=phone)
    db.session.add(customer)
    db.session.flush()
    return customer


def find_or_create_child(parent_id, full_name):
    first, last = split_name(full_name)
    child = Child.query.filter_by(parent_id=parent_id, first_name=first, last_name=last).first()
    if child:
        return child
    child = Child(parent_id=parent_id, first_name=first, last_name=last)
    db.session.add(child)
    db.session.flush()
    return child


# ---------- Auth ----------

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    admin = AdminUser.query.filter_by(email=email).first()
    if not admin or not check_password_hash(admin.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["admin_id"] = admin.id
    return jsonify({"email": admin.email})


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.pop("admin_id", None)
    return jsonify({"ok": True})


@app.route("/api/auth/me", methods=["GET"])
def me():
    admin_id = session.get("admin_id")
    if not admin_id:
        return jsonify({"error": "Authentication required"}), 401
    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        session.pop("admin_id", None)
        return jsonify({"error": "Authentication required"}), 401
    return jsonify({"email": admin.email})


# ---------- Customers (read-only, backs the membership admin form) ----------

@app.route("/api/customers", methods=["GET"])
@login_required
def list_customers():
    customers = Customer.query.order_by(Customer.first_name).all()
    return jsonify([c.to_dict() for c in customers])


# ---------- Birthdays ----------

@app.route("/api/birthdays", methods=["POST"])
def create_birthday():
    data = request.get_json(silent=True) or {}

    child_name = (data.get("childName") or "").strip()
    parent_name = (data.get("parentName") or "").strip()
    phone = (data.get("phone") or "").strip()
    date_val = (data.get("date") or "").strip()
    time_slot = (data.get("timeSlot") or "").strip()
    package = (data.get("package") or "").strip()
    guests = data.get("guests") or 50

    if not all([child_name, parent_name, phone, date_val, time_slot, package]):
        return jsonify({"error": "Missing required fields"}), 400
    if package not in BIRTHDAY_PACKAGES:
        return jsonify({"error": f"Unknown package '{package}'"}), 400

    try:
        guests = int(guests)
    except (TypeError, ValueError):
        guests = 50

    child_age = data.get("childAge")
    try:
        child_age = int(child_age) if child_age not in (None, "") else None
    except (TypeError, ValueError):
        child_age = None

    customer = find_or_create_customer(phone, parent_name)
    find_or_create_child(customer.id, child_name)

    booking = Birthday(
        child_name=child_name,
        parent_name=parent_name,
        phone=phone,
        child_age=child_age,
        date=date_val,
        time_slot=time_slot,
        package=package,
        guests=guests,
        amount=BIRTHDAY_PACKAGES[package],
        notes=(data.get("notes") or "").strip(),
        status="Booked",
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify(booking.to_dict()), 201


@app.route("/api/birthdays", methods=["GET"])
@login_required
def list_birthdays():
    bookings = Birthday.query.order_by(Birthday.id.desc()).all()
    return jsonify([b.to_dict() for b in bookings])


# ---------- Memberships ----------

@app.route("/api/memberships", methods=["POST"])
def create_membership():
    data = request.get_json(silent=True) or {}

    customer_name = (data.get("parentName") or data.get("customerName") or "").strip()
    phone = (data.get("phone") or "").strip()
    plan_type = (data.get("type") or "").strip()
    start_date = (data.get("startDate") or "").strip()
    child_name = (data.get("childName") or "").strip() or None

    if not all([customer_name, phone, plan_type, start_date]):
        return jsonify({"error": "Missing required fields"}), 400
    if plan_type not in MEMBERSHIP_PLANS:
        return jsonify({"error": f"Unknown pass type '{plan_type}'"}), 400

    plan = MEMBERSHIP_PLANS[plan_type]
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "startDate must be YYYY-MM-DD"}), 400
    end_date = (start + timedelta(days=plan["days"])).strftime("%Y-%m-%d")

    customer = find_or_create_customer(phone, customer_name)
    if child_name:
        find_or_create_child(customer.id, child_name)

    membership = Membership(
        customer_name=customer_name,
        phone=phone,
        child_name=child_name,
        type=plan_type,
        start_date=start_date,
        end_date=end_date,
        price=plan["price"],
        status="Active",
        hidden=False,
    )
    db.session.add(membership)
    db.session.commit()

    return jsonify(membership.to_dict()), 201


@app.route("/api/memberships", methods=["GET"])
@login_required
def list_memberships():
    include_hidden = request.args.get("includeHidden") == "1"
    query = Membership.query
    if not include_hidden:
        query = query.filter_by(hidden=False)
    memberships = query.order_by(Membership.id.desc()).all()
    return jsonify([m.to_dict() for m in memberships])


@app.route("/api/memberships/<int:membership_id>", methods=["PATCH"])
@login_required
def update_membership(membership_id):
    membership = db.session.get(Membership, membership_id)
    if not membership:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(silent=True) or {}
    if "hidden" in data:
        membership.hidden = bool(data["hidden"])
    if "status" in data:
        membership.status = data["status"]

    db.session.commit()
    return jsonify(membership.to_dict())


# ---------- Static frontend ----------

@app.route("/")
def index():
    return send_from_directory(ROOT_DIR, "index.html")


def seed_admin():
    if AdminUser.query.count() == 0:
        admin = AdminUser(
            email=app.config["ADMIN_EMAIL"].strip().lower(),
            password_hash=generate_password_hash(app.config["ADMIN_PASSWORD"]),
        )
        db.session.add(admin)
        db.session.commit()
        print(f"[seed] Created admin account: {admin.email} (change the password after logging in)")


with app.app_context():
    try:
        db.create_all()
        seed_admin()
    except Exception as e:
        print(f"[Warning] Could not connect to remote MySQL database: {e}")
        print("[Notice] Check DB_HOST and firewall settings or set USE_SQLITE=true in .env")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
