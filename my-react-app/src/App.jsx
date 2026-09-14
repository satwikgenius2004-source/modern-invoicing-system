import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const getToken = () => {
  return localStorage.getItem("token");
};

const authInputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
};

function App() {
  const [token, setToken] = useState(getToken());
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    plan: "free",
  });
  const [page, setPage] = useState("dashboard");

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    billingAddress: "",
  });
  const [editingClient, setEditingClient] = useState(null);
  const [clientError, setClientError] = useState("");

  const [invoices, setInvoices] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    clientId: "",
    dueDate: "",
    tax: 0,
    status: "Draft",
    items: [
      {
        description: "",
        quantity: 1,
        price: 0,
      },
    ],
  });

  const [invoiceError, setInvoiceError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceFilter, setInvoiceFilter] = useState("All");

  const [isPremium, setIsPremium] = useState(false);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    if (token) {
      fetchClients();
      fetchInvoices();
    }
  }, [token]);

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (
      (authMode === "register" && !authForm.name) ||
      !authForm.email ||
      !authForm.password
    ) {
      setAuthError(
        authMode === "register"
          ? "Name, email and password are required"
          : "Email and password are required"
      );
      return;
    }

    try {
      setAuthLoading(true);

      const endpoint =
        authMode === "register"
          ? `${API_URL}/auth/register`
          : `${API_URL}/auth/login`;

      const body =
        authMode === "register"
          ? authForm
          : {
            email: authForm.email,
            password: authForm.password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setAuthMode("login");
        setAuthError("Registration successful. Please login.");
        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
          plan: "free",
        });
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setIsPremium(data.user.plan === "premium");
        setAuthForm({
          name: "",
          email: "",
          password: "",
          plan: "free",
        });
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setClients([]);
    setInvoices([]);
    setPage("dashboard");
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      setClientError("");

      const response = await fetch(`${API_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      const data = await response.json();
      setClients(data);
    } catch (error) {
      setClientError(error.message);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/invoices`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      setInvoiceError(error.message);
    }
  };

  const handleClientChange = (e) => {
    setClientForm({
      ...clientForm,
      [e.target.name]: e.target.value,
    });
  };

  const addClient = async (e) => {
    e.preventDefault();
    setClientError("");

    if (
      !clientForm.name ||
      !clientForm.email ||
      !clientForm.phone ||
      !clientForm.billingAddress
    ) {
      setClientError("All fields are required");
      return;
    }

    try {
      setLoadingClients(true);

      const response = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(clientForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create client");
      }

      setClients((prev) => [data.client, ...prev]);

      setClientForm({
        name: "",
        email: "",
        phone: "",
        billingAddress: "",
      });

      setPage("clients");
    } catch (error) {
      setClientError(error.message);
    } finally {
      setLoadingClients(false);
    }
  };

  const startEditClient = (client) => {
    setEditingClient(client);

    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      billingAddress: client.billingAddress,
    });

    setPage("create-client");
  };

  const editClient = async (e) => {
    e.preventDefault();
    setClientError("");

    if (
      !clientForm.name ||
      !clientForm.email ||
      !clientForm.phone ||
      !clientForm.billingAddress
    ) {
      setClientError("All fields are required");
      return;
    }

    try {
      setLoadingClients(true);

      const response = await fetch(
        `${API_URL}/clients/${editingClient._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(clientForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update client");
      }

      setClients((prev) =>
        prev.map((client) =>
          client._id === editingClient._id ? data.client : client
        )
      );

      setEditingClient(null);

      setClientForm({
        name: "",
        email: "",
        phone: "",
        billingAddress: "",
      });

      setPage("clients");
    } catch (error) {
      setClientError(error.message);
    } finally {
      setLoadingClients(false);
    }
  };

  const deleteClient = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setClientError("");

      const response = await fetch(`${API_URL}/clients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete client");
      }

      setClients((prev) =>
        prev.filter((client) => client._id !== id)
      );
    } catch (error) {
      setClientError(error.message);
    }
  };

  const handleInvoiceChange = (e) => {
    setInvoiceForm({
      ...invoiceForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceForm.items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
    });
  };

  const addItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        {
          description: "",
          quantity: 1,
          price: 0,
        },
      ],
    });
  };

  const removeItem = (index) => {
    if (invoiceForm.items.length === 1) {
      return;
    }

    const updatedItems = invoiceForm.items.filter(
      (_, itemIndex) => itemIndex !== index
    );

    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
    });
  };

  const subtotal = invoiceForm.items.reduce((sum, item) => {
    return (
      sum +
      Number(item.quantity || 0) * Number(item.price || 0)
    );
  }, 0);

  const taxAmount = (subtotal * Number(invoiceForm.tax || 0)) / 100;
  const total = subtotal + taxAmount;

  const createInvoice = async (e) => {
    e.preventDefault();
    setInvoiceError("");

    if (
      !invoiceForm.invoiceNumber ||
      !invoiceForm.clientId ||
      !invoiceForm.dueDate
    ) {
      setInvoiceError("Please fill all required fields");
      return;
    }

    for (const item of invoiceForm.items) {
      if (!item.description || Number(item.quantity) < 1) {
        setInvoiceError("Please complete all invoice items");
        return;
      }
    }

    try {
      const response = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          invoiceNumber: invoiceForm.invoiceNumber,
          client: invoiceForm.clientId,
          dueDate: invoiceForm.dueDate,
          tax: Number(invoiceForm.tax || 0),
          subtotal,
          taxAmount,
          total,
          status: invoiceForm.status,
          items: invoiceForm.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create invoice");
      }

      setInvoices((prev) => [data.invoice, ...prev]);

      setInvoiceForm({
        invoiceNumber: "",
        clientId: "",
        dueDate: "",
        tax: 0,
        status: "Draft",
        items: [
          {
            description: "",
            quantity: 1,
            price: 0,
          },
        ],
      });

      setPage("invoices");
    } catch (error) {
      setInvoiceError(error.message);
    }
  };

  const filteredInvoices =
    invoiceFilter === "All"
      ? invoices
      : invoices.filter(
        (invoice) => invoice.status === invoiceFilter
      );

  const totalClients = clients.length;
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "Paid"
  ).length;
  const pendingInvoices = invoices.filter(
    (invoice) =>
      invoice.status === "Sent" || invoice.status === "Overdue"
  ).length;

  const handleLogoUpload = (e) => {
    if (!isPremium) {
      alert("Logo upload is available for Premium users only.");
      return;
    }

    const file = e.target.files[0];

    if (file) {
      setLogo(URL.createObjectURL(file));
    }
  };

  const openInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setPage("invoice-details");
  };
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          padding: "20px",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setAuthMode(authMode === "login" ? "register" : "login");
            setAuthError("");
          }}
          style={{
            position: "fixed",
            top: "14px",
            right: "20px",
            zIndex: 1001,
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            background: "#4f46e5",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          {authMode === "login" ? "Register" : "Login"}
        </button>

        < div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#fff",
            padding: "32px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }
          }
        >
          <h1 style={{ marginTop: 0, textAlign: "center" }}>Invoice Pro</h1>
          <p style={{ textAlign: "center", color: "#666" }}>
            {authMode === "login"
              ? "Login to manage your invoices"
              : "Create your Invoice Pro account"}
          </p>

          {
            authError && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "16px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                }}
              >
                {authError}
              </div>
            )
          }

          <form onSubmit={handleAuthSubmit}>
            {authMode === "register" && (
              <div style={{ marginBottom: "16px" }}>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={authForm.name}
                  onChange={handleAuthChange}
                  placeholder="Your name"
                  style={authInputStyle}
                />
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthChange}
                placeholder="you@example.com"
                style={authInputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthChange}
                placeholder="Enter password"
                style={authInputStyle}
              />
            </div>

            {authMode === "register" && (
              <div style={{ marginBottom: "16px" }}>
                <label>Plan</label>
                <select
                  name="plan"
                  value={authForm.plan}
                  onChange={handleAuthChange}
                  style={authInputStyle}
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#fff",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Register"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginBottom: 0 }}>
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
              }}
              style={{
                border: "none",
                background: "none",
                color: "#4f46e5",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div >
      </div >
    );
  }

  return (
    <>
      <Navbar />

      <button
        onClick={logout}
        style={{
          position: "fixed",
          top: "14px",
          right: "20px",
          zIndex: 1001,
          padding: "8px 14px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      <div className="app-layout">
        <Sidebar page={page} setPage={setPage} />

        <main className="main-content">
          {page === "dashboard" && (
            <section>
              <div className="page-header">
                <div>
                  <h1>Dashboard</h1>
                  <p>Manage your clients and invoices.</p>
                </div>
              </div>

              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>Total Clients</h3>
                  <p>{totalClients}</p>
                </div>

                <div className="dashboard-card">
                  <h3>Total Invoices</h3>
                  <p>{totalInvoices}</p>
                </div>

                <div className="dashboard-card">
                  <h3>Paid Invoices</h3>
                  <p>{paidInvoices}</p>
                </div>

                <div className="dashboard-card">
                  <h3>Pending Invoices</h3>
                  <p>{pendingInvoices}</p>
                </div>
              </div>
            </section>
          )}

          {page === "clients" && (
            <section>
              <div className="page-header">
                <div>
                  <h1>Clients</h1>
                  <p>Manage all your clients.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    setEditingClient(null);
                    setClientForm({
                      name: "",
                      email: "",
                      phone: "",
                      billingAddress: "",
                    });
                    setClientError("");
                    setPage("create-client");
                  }}
                >
                  + Add Client
                </button>
              </div>

              {clientError && (
                <div className="error-message">{clientError}</div>
              )}

              {loadingClients ? (
                <div className="loading">Loading clients...</div>
              ) : clients.length === 0 ? (
                <div className="empty-state">
                  <h3>No clients found</h3>
                  <p>Add your first client to get started.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Billing Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {clients.map((client) => (
                        <tr key={client._id}>
                          <td>{client.name}</td>
                          <td>{client.email}</td>
                          <td>{client.phone}</td>
                          <td>{client.billingAddress}</td>
                          <td>
                            <button
                              className="edit-button"
                              onClick={() =>
                                startEditClient(client)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteClient(client._id)
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {page === "create-client" && (
            <section>
              <div className="page-header">
                <div>
                  <h1>
                    {editingClient
                      ? "Edit Client"
                      : "Create Client"}
                  </h1>
                  <p>
                    {editingClient
                      ? "Update client information."
                      : "Add a new client."}
                  </p>
                </div>
              </div>

              {clientError && (
                <div className="error-message">{clientError}</div>
              )}

              <form
                className="client-form"
                onSubmit={
                  editingClient ? editClient : addClient
                }
              >
                <div className="form-group">
                  <label>Client Name</label>
                  <input
                    type="text"
                    name="name"
                    value={clientForm.name}
                    onChange={handleClientChange}
                    placeholder="Enter client name"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={clientForm.email}
                    onChange={handleClientChange}
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={clientForm.phone}
                    onChange={handleClientChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Billing Address</label>
                  <textarea
                    name="billingAddress"
                    value={clientForm.billingAddress}
                    onChange={handleClientChange}
                    placeholder="Enter billing address"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loadingClients}
                  >
                    {loadingClients
                      ? "Saving..."
                      : editingClient
                        ? "Update Client"
                        : "Create Client"}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingClient(null);
                      setClientForm({
                        name: "",
                        email: "",
                        phone: "",
                        billingAddress: "",
                      });
                      setClientError("");
                      setPage("clients");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {page === "invoices" && (
            <section>
              <div className="page-header">
                <div>
                  <h1>Invoices</h1>
                  <p>View and manage your invoices.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    setInvoiceError("");
                    setPage("create-invoice");
                  }}
                >
                  + Create Invoice
                </button>
              </div>

              {invoiceError && (
                <div className="error-message">{invoiceError}</div>
              )}

              <div className="invoice-filters">
                {["All", "Draft", "Sent", "Paid", "Overdue"].map(
                  (filter) => (
                    <button
                      key={filter}
                      className={
                        invoiceFilter === filter
                          ? "filter-button active"
                          : "filter-button"
                      }
                      onClick={() =>
                        setInvoiceFilter(filter)
                      }
                    >
                      {filter}
                    </button>
                  )
                )}
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="empty-state">
                  <h3>No invoices found</h3>
                  <p>Create an invoice to see it here.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Due Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td>{invoice.invoiceNumber}</td>
                          <td>
                            {invoice.client?.name || "Client"}
                          </td>
                          <td>
                            {new Date(
                              invoice.dueDate
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            ₹{Number(invoice.total).toFixed(2)}
                          </td>
                          <td>
                            <span
                              className={`status ${invoice.status.toLowerCase()}`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="view-button"
                              onClick={() =>
                                openInvoice(invoice)
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {page === "create-invoice" && (
            <section>
              <div className="page-header">
                <div>
                  <h1>Create Invoice</h1>
                  <p>Create a new invoice for your client.</p>
                </div>
              </div>

              {invoiceError && (
                <div className="error-message">{invoiceError}</div>
              )}

              <form
                className="invoice-form"
                onSubmit={createInvoice}
              >
                <div className="form-row">
                  <div className="form-group">
                    <label>Invoice Number</label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={invoiceForm.invoiceNumber}
                      onChange={handleInvoiceChange}
                      placeholder="INV-001"
                    />
                  </div>

                  <div className="form-group">
                    <label>Client</label>
                    <select
                      name="clientId"
                      value={invoiceForm.clientId}
                      onChange={handleInvoiceChange}
                    >
                      <option value="">Select Client</option>

                      {clients.map((client) => (
                        <option
                          key={client._id}
                          value={client._id}
                        >
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={invoiceForm.dueDate}
                      onChange={handleInvoiceChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={invoiceForm.status}
                    onChange={handleInvoiceChange}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div className="invoice-items">
                  <div className="section-header">
                    <h3>Invoice Items</h3>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={addItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  {invoiceForm.items.map((item, index) => (
                    <div className="invoice-item" key={index}>
                      <div className="form-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Item description"
                        />
                      </div>

                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Price</label>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "price",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="form-group tax-field">
                  <label>Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.tax}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        tax: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="invoice-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>₹{subtotal.toFixed(2)}</strong>
                  </div>

                  <div>
                    <span>Tax</span>
                    <strong>₹{taxAmount.toFixed(2)}</strong>
                  </div>

                  <div className="total-row">
                    <span>Total</span>
                    <strong>₹{total.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="premium-section">
                  <div className="premium-header">
                    <h3>Premium Branding</h3>

                    <label className="premium-toggle">
                      <input
                        type="checkbox"
                        checked={isPremium}
                        onChange={(e) =>
                          setIsPremium(e.target.checked)
                        }
                      />
                      Premium User
                    </label>
                  </div>

                  <div className="logo-upload">
                    <label>Company Logo</label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={!isPremium}
                    />

                    {!isPremium && (
                      <p>
                        Logo upload is available for Premium
                        users only.
                      </p>
                    )}

                    {logo && (
                      <img
                        src={logo}
                        alt="Company Logo"
                        className="logo-preview"
                      />
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Create Invoice
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setPage("invoices")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {page === "invoice-details" && selectedInvoice && (
            <section>
              <div className="page-header no-print">
                <div>
                  <h1>Invoice Details</h1>
                  <p>
                    {selectedInvoice.invoiceNumber}
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => window.print()}
                >
                  Print Invoice
                </button>
              </div>

              <div className="printable-invoice">
                {logo && isPremium && (
                  <img
                    src={logo}
                    alt="Company Logo"
                    className="invoice-logo"
                  />
                )}

                <div className="invoice-top">
                  <div>
                    <h1>INVOICE</h1>
                    <p>
                      #
                      {selectedInvoice.invoiceNumber}
                    </p>
                  </div>

                  <div>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {new Date(
                        selectedInvoice.dueDate
                      ).toLocaleDateString()}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedInvoice.status}
                    </p>
                  </div>
                </div>

                <div className="invoice-client">
                  <h3>Bill To</h3>

                  <p>
                    {selectedInvoice.client?.name}
                  </p>

                  <p>
                    {selectedInvoice.client?.email}
                  </p>

                  <p>
                    {selectedInvoice.client?.phone}
                  </p>

                  <p>
                    {selectedInvoice.client?.billingAddress}
                  </p>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedInvoice.items.map(
                        (item, index) => (
                          <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>
                              ₹
                              {Number(item.price).toFixed(2)}
                            </td>
                            <td>
                              ₹
                              {(
                                Number(item.quantity) *
                                Number(item.price)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="invoice-total">
                  <p>
                    <span>Subtotal</span>
                    <strong>
                      ₹
                      {Number(
                        selectedInvoice.subtotal
                      ).toFixed(2)}
                    </strong>
                  </p>

                  <p>
                    <span>Tax</span>
                    <strong>
                      ₹
                      {Number(
                        selectedInvoice.taxAmount
                      ).toFixed(2)}
                    </strong>
                  </p>

                  <p className="grand-total">
                    <span>Total</span>
                    <strong>
                      ₹
                      {Number(
                        selectedInvoice.total
                      ).toFixed(2)}
                    </strong>
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

export default App;