import { useEffect, useState } from "react";
import "./Profile.css";
import { userApi } from "../api/userApi";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // EDIT MODE
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [profileRes, bookingRes] = await Promise.all([
        userApi.getMyProfile(),
        userApi.getMyBookings()
      ]);

      setUser(profileRes.data);
      setBookings(bookingRes.data);
      setForm(profileRes.data);

    } catch (error) {
      console.log("Lỗi load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await userApi.updateMyProfile(form);
      setEditMode(false);
      fetchData();
      alert("Cập nhật thành công!");
    } catch (err) {
      alert("Cập nhật thất bại!");
    }
  };

  // LOADING
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        Đang tải hồ sơ...
      </div>
    );
  }

  // NULL USER
  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        Không tìm thấy thông tin user
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-card">

        {/* LEFT */}
        <div className="profile-left">
          <img
            className="avatar"
            src={user.avatar || "https://i.pravatar.cc/150"}
            alt="avatar"
          />

          <h2>{user.name}</h2>
          <p className="role">{user.role}</p>

          <button
            className="btn-edit"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}
          </button>
        </div>

        {/* RIGHT */}
        <div className="profile-right">

          <h3>Thông tin cá nhân</h3>

          {/* VIEW MODE */}
          {!editMode ? (
            <div className="info">
              <div>
                <span>Họ tên</span>
                <b>{user.name}</b>
              </div>

              <div>
                <span>Email</span>
                <b>{user.email}</b>
              </div>

              <div>
                <span>Số điện thoại</span>
                <b>{user.phone}</b>
              </div>

              <div>
                <span>Địa chỉ</span>
                <b>{user.address}</b>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <div className="info">
              <input
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                placeholder="Họ tên"
              />

              <input
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                placeholder="Số điện thoại"
              />

              <input
                name="address"
                value={form.address || ""}
                onChange={handleChange}
                placeholder="Địa chỉ"
              />

              <button className="btn-save" onClick={handleSave}>
                Lưu thay đổi
              </button>
            </div>
          )}

          <h3>Lịch sử đặt phòng</h3>

          <div className="booking-list">
            {bookings.length === 0 ? (
              <p>Chưa có lịch đặt phòng</p>
            ) : (
              bookings.map((b, index) => (
                <div key={index} className="booking-item">
                  <div>
                    <b>{b.roomName}</b>
                    <p>
                      {b.checkIn} - {b.checkOut}
                    </p>
                  </div>

                  <span className={`status ${b.status}`}>
                    {b.status === "success"
                      ? "Đã xác nhận"
                      : "Đang xử lý"}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}