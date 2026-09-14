function Sidebar({ page, setPage }) {
    return (
        <aside className="sidebar">
            <button
                className={page === "dashboard" ? "active" : ""}
                onClick={() => setPage("dashboard")}
            >
                Dashboard
            </button>

            <button
                className={
                    page === "clients" || page === "create-client"
                        ? "active"
                        : ""
                }
                onClick={() => setPage("clients")}
            >
                Clients
            </button>

            <button
                className={
                    page === "invoices" ||
                        page === "create-invoice" ||
                        page === "invoice-details"
                        ? "active"
                        : ""
                }
                onClick={() => setPage("invoices")}
            >
                Invoices
            </button>
        </aside>
    );
}

export default Sidebar;