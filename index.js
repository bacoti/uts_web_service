const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

let tickets = [
  {
    id: "1",
    event: "Konser For Revenge",
    date: "2025-11-20",
    price: 500000,
    category: "VIP",
    available: 100,
  },
  {
    id: "2",
    event: "Festival KMI EXPO",
    date: "2025-12-21",
    price: 150000,
    category: "Regular",
    available: 50,
  },
  {
    id: "3",
    event: "Seminar Programming",
    date: "2025-11-19",
    price: 75000,
    category: "Economy",
    available: 200,
  },
  {
    id: "4",
    event: "Standup Comedy Barasuara",
    date: "2025-11-25",
    price: 300000,
    category: "VIP",
    available: 20,
  },
  {
    id: "5",
    event: "Pameran Seni Rupa",
    date: "2025-12-10",
    price: 50000,
    category: "Regular",
    available: 300,
  },
];

const validateTicket = (body) => {
  const { event, date, price, category, available } = body;
  const errors = [];

  if (!event || !date || !price || !category || !available) {
    return "Field event, date, price, category, dan available wajib diisi.";
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) errors.push("Format date harus YYYY-MM-DD.");

  if (typeof price !== "number" || price <= 0)
    errors.push("Price harus angka dan > 0.");
  if (typeof available !== "number" || available <= 0)
    errors.push("Available harus angka dan > 0.");

  const validCategories = ["VIP", "Regular", "Economy"];
  if (!validCategories.includes(category))
    errors.push("Category hanya boleh VIP, Regular, atau Economy.");

  return errors.length > 0 ? errors : null;
};

app.post("/tickets", (req, res) => {
  const validationError = validateTicket(req.body);
  if (validationError) {
    return res.status(400).json({ errors: validationError });
  }

  const newId = Date.now().toString();

  const newTicket = {
    id: newId,
    ...req.body,
  };

  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

app.get("/tickets", (req, res) => {
  let result = [...tickets];

  if (req.query.category) {
    result = result.filter((t) => t.category === req.query.category);
  }
  if (req.query.date) {
    result = result.filter((t) => t.date === req.query.date);
  }

  if (req.query.sortPrice) {
    const sortOrder = req.query.sortPrice.toLowerCase();
    if (sortOrder === "asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      result.sort((a, b) => b.price - a.price);
    }
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || result.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedResult = result.slice(startIndex, endIndex);

  res.json({
    page,
    limit,
    totalData: result.length,
    data: paginatedResult,
  });
});

app.get("/tickets/:id", (req, res) => {
  const ticket = tickets.find((t) => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  res.json(ticket);
});

app.put("/tickets/:id", (req, res) => {
  const index = tickets.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const { event, date, price, category, available } = req.body;

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "Format date salah" });
  if (price !== undefined && (typeof price !== "number" || price <= 0))
    return res.status(400).json({ error: "Price invalid" });
  if (
    available !== undefined &&
    (typeof available !== "number" || available <= 0)
  )
    return res.status(400).json({ error: "Available invalid" });
  if (category && !["VIP", "Regular", "Economy"].includes(category))
    return res.status(400).json({ error: "Category invalid" });

  tickets[index] = {
    ...tickets[index],
    ...req.body,
    id: tickets[index].id,
  };

  res.json(tickets[index]);
});

app.delete("/tickets/:id", (req, res) => {
  const index = tickets.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  tickets.splice(index, 1);
  res.json({ message: "Ticket deleted successfully" });
});

app.post("/tickets/:id/purchase", (req, res) => {
  const ticket = tickets.find((t) => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const { quantity } = req.body;

  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ error: "Quantity harus number dan > 0" });
  }

  if (quantity > ticket.available) {
    return res
      .status(400)
      .json({ error: `Stok tidak cukup. Sisa: ${ticket.available}` });
  }

  ticket.available -= quantity;

  res.json({
    message: "Purchase successful",
    remaining: ticket.available,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Dummy data loaded:", tickets.length, "items");
});
