import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "../styles/adminDashboard.css";

const AdminDashboard = () => {
  const [jobListings, setJobListings] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", content: "" });
  const [expandedJobId, setExpandedJobId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("No token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          console.warn("Token expired. Redirecting to login.");
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }

        const { data } = await axios.get(
          "https://job-back-2jtb.onrender.com/api/admin/check-admin",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!data.isAdmin) {
          alert("Access denied. Admins only.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Admin check failed:", error);
        alert("Unable to verify admin status. Please log in.");
        navigate("/login");
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchPendingJobs = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("No token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const { data } = await axios.get(
          "https://job-back-2jtb.onrender.com/api/job/pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const pendingJobs = data?.filter((job) => job.isApproved === false) || [];
        setJobListings(pendingJobs);
      } catch (error) {
        console.error("Error fetching pending jobs:", error.message);
        setJobListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingJobs();
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("No token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const { data } = await axios.get(
          "https://job-back-2jtb.onrender.com/api/admin/manage-users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserList(data.users);
      } catch (error) {
        console.error("Error fetching users:", error.message);
        setUserList([]);
      }
    };

    fetchUsers();
  }, [navigate]);

  const approveJob = async (jobId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      const { data } = await axios.put(
        `https://job-back-2jtb.onrender.com/api/job/approve/${jobId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage({
        type: "success",
        content: data.message || "Job approved successfully.",
      });
      setJobListings((prevJobs) =>
        prevJobs.filter((job) => job._id !== jobId)
      );
    } catch (error) {
      console.error("Error approving job listing:", error.message);
      setMessage({
        type: "error",
        content: error.response?.data?.message || "Failed to approve job listing.",
      });
    }
  };

  const toggleDescription = (jobId) => {
    setExpandedJobId((prevId) => (prevId === jobId ? null : jobId));
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Approve job listings submitted by employers and manage users.</p>

      {message.content && (
        <p
          className={message.type === "success" ? "success-message" : "error-message"}
        >
          {message.content}
        </p>
      )}

      <h2>Pending Job Listings</h2>
      {loading ? (
        <p>Loading job listings...</p>
      ) : jobListings.length === 0 ? (
        <p>No job listings pending approval.</p>
      ) : (
        <table className="job-listings-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Location</th>
              <th>Salary Range</th>
              <th>Category</th>
              <th>Experience</th>
              <th>Contact</th>
              <th>Job Type</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobListings.map((job) => (
              <tr key={job._id}>
                <td>{job.title}</td>
                <td>{job.company || "Company not available"}</td>
                <td>{job.location}</td>
                <td>{job.salaryRange}</td>
                <td>{job.category}</td>
                <td>{job.experience}</td>
                <td>{job.contact}</td>
                <td>{job.jobType}</td>
                <td>
  <div
    className={`description ${
      expandedJobId === job._id ? "expanded" : ""
    }`}
  >
    <div
      className={`text-preview ${
        expandedJobId === job._id ? "expanded" : ""
      }`}
    >
      {job.description}
    </div>
    <button
      className="read-more"
      onClick={() => toggleDescription(job._id)}
    >
      {expandedJobId === job._id ? "Show Less" : "Read More"}
    </button>
  </div>
</td>

                <td>
                  <button
                    onClick={() => approveJob(job._id)}
                    className="approve-button"
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Manage Users</h2>
      <table className="user-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge ${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
