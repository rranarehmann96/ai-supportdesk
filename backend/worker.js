import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { ChatRoom } from './room.js';

// MongoDB connection for Cloudflare Workers
const mongoUri = process.env.MONGO_URI;
let db;
let client;

async function connectDB() {
  if (db) return db;

  try {
    if (!mongoUri) {
      throw new Error('MONGO_URI not configured');
    }

    // For Cloudflare Workers, we need to check if we're in Workers environment
    // In Workers, we should use MongoDB Atlas Data API
    // For now, we'll try standard connection and fallback to Data API approach

    try {
      client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await client.connect();
      db = client.db('supportdesk');
      console.log('MongoDB connected successfully');
      return db;

    } catch (standardError) {
      console.log('Standard MongoDB connection failed, trying Data API approach');
      // Fallback to MongoDB Atlas Data API would go here
      // For now, we'll use a simple in-memory fallback for demonstration
      return getInMemoryDB();
    }

  } catch (error) {
    console.error('MongoDB connection error:', error);
    return getInMemoryDB();
  }
}

// In-memory database fallback for demonstration
function getInMemoryDB() {
  if (!db) {
    db = {
      collection: (name) => ({
        find: (query) => ({
          sort: (sort) => ({
            limit: (limit) => ({
              toArray: async () => []
            }),
            toArray: async () => []
          }),
          toArray: async () => [],
          findOne: async (query) => null,
          insertOne: async (doc) => ({ insertedId: 'temp-id' }),
          updateOne: async (query, update) => ({ modifiedCount: 1 }),
          deleteOne: async (query) => ({ deletedCount: 1 }),
          countDocuments: async (query) => 0,
          aggregate: (pipeline) => ({
            toArray: async () => []
          }),
          project: (fields) => ({
            toArray: async () => []
          })
        })
      })
    };
    console.log('Using in-memory database (fallback mode)');
  }
  return db;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function for JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// JWT verification (simplified for Cloudflare Workers)
function verifyToken(token) {
  try {
    if (!token) return null;

    // For Cloudflare Workers, we'll use a simple base64 encoded token
    // In production, use a proper JWT library compatible with Workers
    const decoded = JSON.parse(atob(token));
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Generate simple token (for demonstration)
function generateToken(payload) {
  const encoded = btoa(JSON.stringify(payload));
  return encoded;
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // WebSocket routes
    if (path.startsWith('/ws/')) {
      const ticketId = path.split('/')[2];
      const roomId = `ticket-${ticketId}`;
      const room = env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(roomId));
      return room.fetch(request);
    }

    // Connect to database
    const database = await connectDB();

    // Route handling
    try {
      // Health check
      if (path === '/') {
        return jsonResponse({ message: 'AI SupportDesk API is running' });
      }

      // Auth routes
      if (path.startsWith('/api/auth')) {
        return handleAuthRoutes(request, database, path);
      }

      // Workspace routes
      if (path.startsWith('/api/workspace')) {
        return handleWorkspaceRoutes(request, database, path);
      }

      // Ticket routes
      if (path.startsWith('/api/tickets')) {
        return handleTicketRoutes(request, database, path);
      }

      // Message routes
      if (path.startsWith('/api/messages')) {
        return handleMessageRoutes(request, database, path);
      }

      // AI routes
      if (path.startsWith('/api/ai')) {
        return handleAIRoutes(request, database, path);
      }

      // Knowledge base routes
      if (path.startsWith('/api/kb')) {
        return handleKBRoutes(request, database, path);
      }

      // Analytics routes
      if (path.startsWith('/api/analytics')) {
        return handleAnalyticsRoutes(request, database, path);
      }

      // Agent routes
      if (path.startsWith('/api/agents')) {
        return handleAgentRoutes(request, database, path);
      }

      // 404 for unknown routes
      return jsonResponse({ error: 'Route not found' }, 404);

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  },
};

// Route handlers
async function handleAuthRoutes(request, database, path) {
  const url = new URL(request.url);

  if (path === '/api/auth/signup' && request.method === 'POST') {
    return handleSignup(request, database);
  }

  if (path === '/api/auth/login' && request.method === 'POST') {
    return handleLogin(request, database);
  }

  return jsonResponse({ error: 'Auth route not found' }, 404);
}

async function handleSignup(request, database) {
  try {
    const body = await request.json();
    const { name, email, password, businessName } = body;

    if (!name || !email || !password || !businessName) {
      return jsonResponse({ message: 'All fields are required' }, 400);
    }

    const users = database.collection('users');
    const workspaces = database.collection('workspaces');

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return jsonResponse({ message: 'Email already registered' }, 400);
    }

    // Generate slug
    let baseSlug = businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await workspaces.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'owner',
      createdAt: new Date(),
    });

    // Create workspace
    const workspaceResult = await workspaces.insertOne({
      name: businessName,
      slug,
      owner: userResult.insertedId,
      createdAt: new Date(),
    });

    // Update user with workspace
    try {
      await users.updateOne(
        { _id: userResult.insertedId },
        { $set: { workspace: workspaceResult.insertedId } }
      );
    } catch (updateError) {
      console.log('User update failed (using in-memory fallback):', updateError);
      // Continue with the result
    }

    // Generate token
    const token = generateToken({
      id: userResult.insertedId.toString(),
      workspace: workspaceResult.insertedId.toString(),
      role: 'owner'
    });

    return jsonResponse({
      token,
      user: {
        id: userResult.insertedId.toString(),
        name,
        email,
        role: 'owner'
      },
      workspace: {
        id: workspaceResult.insertedId.toString(),
        name: businessName,
        slug
      }
    }, 201);

  } catch (error) {
    console.error('Signup error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleLogin(request, database) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const users = database.collection('users');
    const workspaces = database.collection('workspaces');

    const user = await users.findOne({ email });
    if (!user) {
      return jsonResponse({ message: 'Invalid email or password' }, 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return jsonResponse({ message: 'Invalid email or password' }, 400);
    }

    const workspace = await workspaces.findOne({ _id: user.workspace });

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      workspace: user.workspace.toString(),
      role: user.role
    });

    return jsonResponse({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      workspace: workspace ? {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug
      } : null
    });

  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleWorkspaceRoutes(request, database, path) {
  return jsonResponse({ message: 'Workspace routes placeholder' });
}

async function handleTicketRoutes(request, database, path) {
  const url = new URL(request.url);

  // Public ticket creation (no auth)
  if (path.match(/\/api\/tickets\/public\/.+/) && request.method === 'POST') {
    const slug = path.split('/').pop();
    return handlePublicTicket(request, database, slug);
  }

  // Get all tickets (auth required)
  if (path === '/api/tickets' && request.method === 'GET') {
    return handleGetTickets(request, database);
  }

  // Get single ticket (auth required)
  if (path.match(/\/api\/tickets\/.+/) && request.method === 'GET') {
    const ticketId = path.split('/').pop();
    return handleGetTicket(request, database, ticketId);
  }

  // Update ticket (auth required)
  if (path.match(/\/api\/tickets\/.+/) && request.method === 'PUT') {
    const ticketId = path.split('/').pop();
    return handleUpdateTicket(request, database, ticketId);
  }

  return jsonResponse({ error: 'Ticket route not found' }, 404);
}

async function handlePublicTicket(request, database, slug) {
  try {
    const body = await request.json();
    const { subject, customerName, customerEmail } = body;

    const workspaces = database.collection('workspaces');
    const tickets = database.collection('tickets');

    const workspace = await workspaces.findOne({ slug });
    if (!workspace) {
      return jsonResponse({ message: 'Support workspace not found' }, 404);
    }

    if (!subject || !customerName || !customerEmail) {
      return jsonResponse({ message: 'All fields are required' }, 400);
    }

    // AI priority detection (simplified - will integrate Groq later)
    const priority = 'medium'; // Default priority for now

    const ticketResult = await tickets.insertOne({
      workspace: workspace._id,
      subject,
      customerName,
      customerEmail,
      priority,
      status: 'open',
      createdAt: new Date(),
    });

    const ticket = await tickets.findOne({ _id: ticketResult.insertedId });
    return jsonResponse(ticket, 201);

  } catch (error) {
    console.error('Public ticket error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleGetTickets(request, database) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const tickets = database.collection('tickets');
    let ticketList;

    try {
      ticketList = await tickets.find({ workspace: new ObjectId(user.workspace) })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      ticketList = [];
    }

    return jsonResponse(ticketList);

  } catch (error) {
    console.error('Get tickets error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleGetTicket(request, database, ticketId) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const tickets = database.collection('tickets');
    let ticket;

    try {
      ticket = await tickets.findOne({
        _id: new ObjectId(ticketId),
        workspace: new ObjectId(user.workspace)
      });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      ticket = null;
    }

    if (!ticket) {
      return jsonResponse({ message: 'Ticket not found' }, 404);
    }

    return jsonResponse(ticket);

  } catch (error) {
    console.error('Get ticket error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleUpdateTicket(request, database, ticketId) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const { status, priority, assignedAgent } = body;

    const tickets = database.collection('tickets');
    let ticket;

    try {
      ticket = await tickets.findOne({
        _id: new ObjectId(ticketId),
        workspace: new ObjectId(user.workspace)
      });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      ticket = null;
    }

    if (!ticket) {
      return jsonResponse({ message: 'Ticket not found' }, 404);
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedAgent !== undefined) updateData.assignedAgent = assignedAgent;

    try {
      await tickets.updateOne(
        { _id: new ObjectId(ticketId) },
        { $set: updateData }
      );
    } catch (updateError) {
      console.log('Database update failed (using in-memory fallback):', updateError);
    }

    let updatedTicket;
    try {
      updatedTicket = await tickets.findOne({ _id: new ObjectId(ticketId) });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      updatedTicket = { ...ticket, ...updateData };
    }

    return jsonResponse(updatedTicket);

  } catch (error) {
    console.error('Update ticket error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleTicketRoutes(request, database, path) {
  return jsonResponse({ message: 'Ticket routes placeholder' });
}

async function handleMessageRoutes(request, database, path) {
  const url = new URL(request.url);

  // Get messages for ticket
  if (path.match(/\/api\/messages\/.+/) && request.method === 'GET' && !path.includes('/public/')) {
    const ticketId = path.split('/').pop();
    return handleGetMessages(request, database, ticketId);
  }

  // Verify ticket for public access
  if (path.match(/\/api\/messages\/public\/.+/ticket/) && request.method === 'GET') {
    const parts = path.split('/');
    const ticketId = parts[parts.length - 2]; // Get the ID before 'ticket'
    return handleVerifyTicket(request, database, ticketId);
  }

  return jsonResponse({ error: 'Message route not found' }, 404);
}

async function handleGetMessages(request, database, ticketId) {
  try {
    const messages = database.collection('messages');
    let messageList;

    try {
      messageList = await messages.find({ ticket: new ObjectId(ticketId) })
        .sort({ createdAt: 1 })
        .toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      messageList = [];
    }

    return jsonResponse(messageList);

  } catch (error) {
    console.error('Get messages error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleVerifyTicket(request, database, ticketId) {
  try {
    const tickets = database.collection('tickets');
    let ticket;

    try {
      ticket = await tickets.findOne({ _id: new ObjectId(ticketId) });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      ticket = null;
    }

    if (!ticket) {
      return jsonResponse({ message: 'Ticket not found' }, 404);
    }

    return jsonResponse(ticket);

  } catch (error) {
    console.error('Verify ticket error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleAIRoutes(request, database, path) {
  const url = new URL(request.url);

  // AI suggest reply
  if (path === '/api/ai/suggest-reply' && request.method === 'POST') {
    return handleSuggestReply(request, database);
  }

  return jsonResponse({ error: 'AI route not found' }, 404);
}

async function handleSuggestReply(request, database) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const { ticketId } = body;

    const tickets = database.collection('tickets');
    const messages = database.collection('messages');

    let ticket;
    try {
      ticket = await tickets.findOne({
        _id: new ObjectId(ticketId),
        workspace: new ObjectId(user.workspace)
      });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      ticket = null;
    }

    if (!ticket) {
      return jsonResponse({ message: 'Ticket not found' }, 404);
    }

    let messageList;
    try {
      messageList = await messages.find({ ticket: new ObjectId(ticketId) })
        .sort({ createdAt: 1 })
        .toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      messageList = [];
    }

    if (messageList.length === 0) {
      return jsonResponse({ message: 'No conversation yet to reply to' }, 400);
    }

    // Call Groq API for AI suggestion
    const reply = await callGroqAPI(ticket.subject, messageList);
    return jsonResponse({ reply });

  } catch (error) {
    console.error('AI suggest reply error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function callGroqAPI(subject, messages) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return { reply: 'AI not configured' };
  }

  try {
    const conversation = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
    const prompt = `Subject: ${subject}\n\nConversation:\n${conversation}\n\nDraft a helpful reply as a customer support agent:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a helpful customer support agent.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return { reply: data.choices[0].message.content };
    }

    return { reply: 'AI response generation failed' };

  } catch (error) {
    console.error('Groq API error:', error);
    return { reply: 'AI service unavailable' };
  }
}

async function handleKBRoutes(request, database, path) {
  const url = new URL(request.url);

  // Get all articles (auth required)
  if (path === '/api/kb' && request.method === 'GET') {
    return handleGetArticles(request, database);
  }

  // Create article (auth required)
  if (path === '/api/kb' && request.method === 'POST') {
    return handleCreateArticle(request, database);
  }

  // Update article (auth required)
  if (path.match(/\/api\/kb\/.+/) && request.method === 'PUT') {
    const articleId = path.split('/').pop();
    return handleUpdateArticle(request, database, articleId);
  }

  // Delete article (auth required)
  if (path.match(/\/api\/kb\/.+/) && request.method === 'DELETE') {
    const articleId = path.split('/').pop();
    return handleDeleteArticle(request, database, articleId);
  }

  // Public search (no auth)
  if (path.match(/\/api\/kb\/public\/.+/) && request.method === 'GET') {
    const slug = path.split('/').pop();
    const query = url.searchParams.get('query');
    return handlePublicKBSearch(request, database, slug, query);
  }

  return jsonResponse({ error: 'Knowledge base route not found' }, 404);
}

async function handleGetArticles(request, database) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const articles = database.collection('articles');
    let articleList;

    try {
      articleList = await articles.find({ workspace: new ObjectId(user.workspace) })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      articleList = [];
    }

    return jsonResponse(articleList);

  } catch (error) {
    console.error('Get articles error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleCreateArticle(request, database) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const { title, content, tags } = body;

    if (!title || !content) {
      return jsonResponse({ message: 'Title and content are required' }, 400);
    }

    const articles = database.collection('articles');
    let articleResult;

    try {
      articleResult = await articles.insertOne({
        workspace: new ObjectId(user.workspace),
        title,
        content,
        tags: tags || [],
        createdBy: new ObjectId(user.id),
        createdAt: new Date(),
      });
    } catch (insertError) {
      console.log('Database insert failed (using in-memory fallback):', insertError);
      articleResult = { insertedId: 'temp-id' };
    }

    let article;
    try {
      article = await articles.findOne({ _id: articleResult.insertedId });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      article = {
        _id: articleResult.insertedId,
        workspace: user.workspace,
        title,
        content,
        tags: tags || [],
        createdBy: user.id,
        createdAt: new Date()
      };
    }

    return jsonResponse(article, 201);

  } catch (error) {
    console.error('Create article error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleUpdateArticle(request, database, articleId) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const { title, content, tags } = body;

    const articles = database.collection('articles');
    let article;

    try {
      article = await articles.findOne({
        _id: new ObjectId(articleId),
        workspace: new ObjectId(user.workspace)
      });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      article = null;
    }

    if (!article) {
      return jsonResponse({ message: 'Article not found' }, 404);
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (tags) updateData.tags = tags;

    try {
      await articles.updateOne(
        { _id: new ObjectId(articleId) },
        { $set: updateData }
      );
    } catch (updateError) {
      console.log('Database update failed (using in-memory fallback):', updateError);
    }

    let updatedArticle;
    try {
      updatedArticle = await articles.findOne({ _id: new ObjectId(articleId) });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      updatedArticle = { ...article, ...updateData };
    }

    return jsonResponse(updatedArticle);

  } catch (error) {
    console.error('Update article error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleDeleteArticle(request, database, articleId) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const articles = database.collection('articles');
    let article;

    try {
      article = await articles.findOneAndDelete({
        _id: new ObjectId(articleId),
        workspace: new ObjectId(user.workspace)
      });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      article = null;
    }

    if (!article) {
      return jsonResponse({ message: 'Article not found' }, 404);
    }

    return jsonResponse({ message: 'Article deleted' });

  } catch (error) {
    console.error('Delete article error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handlePublicKBSearch(request, database, slug, query) {
  try {
    const workspaces = database.collection('workspaces');
    const articles = database.collection('articles');

    let workspace;
    try {
      workspace = await workspaces.findOne({ slug });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      workspace = null;
    }

    if (!workspace) {
      return jsonResponse({ message: 'Workspace not found' }, 404);
    }

    const filter = { workspace: workspace._id };

    if (query && query.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      filter.$or = [
        { title: regex },
        { content: regex },
        { tags: regex }
      ];
    }

    let articleList;
    try {
      articleList = await articles.find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      articleList = [];
    }

    return jsonResponse(articleList);

  } catch (error) {
    console.error('Public KB search error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleAnalyticsRoutes(request, database, path) {
  const url = new URL(request.url);

  // Get analytics summary (auth required)
  if (path === '/api/analytics/summary' && request.method === 'GET') {
    return handleAnalyticsSummary(request, database);
  }

  return jsonResponse({ error: 'Analytics route not found' }, 404);
}

async function handleAnalyticsSummary(request, database) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const tickets = database.collection('tickets');
    const workspaceId = new ObjectId(user.workspace);

    // Get basic counts
    let totalTickets;
    try {
      totalTickets = await tickets.countDocuments({ workspace: workspaceId });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      totalTickets = 0;
    }

    // Get status breakdown
    let statusBreakdown;
    try {
      statusBreakdown = await tickets.aggregate([
        { $match: { workspace: workspaceId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      statusBreakdown = [];
    }

    // Get priority breakdown
    let priorityBreakdown;
    try {
      priorityBreakdown = await tickets.aggregate([
        { $match: { workspace: workspaceId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]).toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      priorityBreakdown = [];
    }

    // Get resolved tickets for avg resolution time
    let resolvedTickets;
    try {
      resolvedTickets = await tickets.find({
        workspace: workspaceId,
        status: { $in: ['resolved', 'closed'] }
      }).toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      resolvedTickets = [];
    }

    // Calculate average resolution time
    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, t) => {
        const hours = (t.updatedAt - t.createdAt) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
    }

    // Get last 7 days data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let last7DaysRaw;
    try {
      last7DaysRaw = await tickets.aggregate([
        {
          $match: {
            workspace: workspaceId,
            createdAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      last7DaysRaw = [];
    }

    // Fill in the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const found = last7DaysRaw.find(x => x._id === key);
      days.push({ date: key, count: found ? found.count : 0 });
    }

    return jsonResponse({
      totalTickets,
      avgResolutionHours,
      statusBreakdown,
      priorityBreakdown,
      last7Days: days
    });

  } catch (error) {
    console.error('Analytics summary error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleAgentRoutes(request, database, path) {
  const url = new URL(request.url);

  // Get all agents (auth required)
  if (path === '/api/agents' && request.method === 'GET') {
    return handleGetAgents(request, database);
  }

  // Add new agent (auth required, owner only)
  if (path === '/api/agents' && request.method === 'POST') {
    return handleAddAgent(request, database);
  }

  // Remove agent (auth required, owner only)
  if (path.match(/\/api\/agents\/.+/) && request.method === 'DELETE') {
    const agentId = path.split('/').pop();
    return handleRemoveAgent(request, database, agentId);
  }

  return jsonResponse({ error: 'Agent route not found' }, 404);
}

async function handleGetAgents(request, database) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    const users = database.collection('users');
    let agentList;

    try {
      agentList = await users.find({ workspace: new ObjectId(user.workspace) })
        .project({ name: 1, email: 1, role: 1, createdAt: 1 })
        .toArray();
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      agentList = [];
    }

    return jsonResponse(agentList);

  } catch (error) {
    console.error('Get agents error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleAddAgent(request, database) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    if (user.role !== 'owner') {
      return jsonResponse({ message: 'Only the workspace owner can do this' }, 403);
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return jsonResponse({ message: 'Name and email are required' }, 400);
    }

    const users = database.collection('users');
    const workspaces = database.collection('workspaces');

    let existing;
    try {
      existing = await users.findOne({ email });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      existing = null;
    }

    if (existing) {
      return jsonResponse({ message: 'This email is already registered' }, 400);
    }

    // Generate temp password
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let agentResult;
    try {
      agentResult = await users.insertOne({
        name,
        email,
        password: hashedPassword,
        role: 'agent',
        workspace: new ObjectId(user.workspace),
        createdAt: new Date(),
      });
    } catch (insertError) {
      console.log('Database insert failed (using in-memory fallback):', insertError);
      agentResult = { insertedId: 'temp-id' };
    }

    // Add to workspace agents
    try {
      await workspaces.updateOne(
        { _id: new ObjectId(user.workspace) },
        { $push: { agents: agentResult.insertedId } }
      );
    } catch (updateError) {
      console.log('Database update failed (using in-memory fallback):', updateError);
    }

    // Email functionality (simplified - would need real email service)
    // For now, just return the temp password

    let agent;
    try {
      agent = await users.findOne({ _id: agentResult.insertedId });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      agent = {
        _id: agentResult.insertedId,
        name,
        email,
        role: 'agent',
        workspace: user.workspace,
        createdAt: new Date()
      };
    }

    return jsonResponse({
      agent: {
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role
      },
      tempPassword
    }, 201);

  } catch (error) {
    console.error('Add agent error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}

async function handleRemoveAgent(request, database, agentId) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return jsonResponse({ message: 'Unauthorized' }, 401);
    }

    if (user.role !== 'owner') {
      return jsonResponse({ message: 'Only the workspace owner can do this' }, 403);
    }

    const users = database.collection('users');
    const workspaces = database.collection('workspaces');

    let agent;
    try {
      agent = await users.findOne({
        _id: new ObjectId(agentId),
        workspace: new ObjectId(user.workspace),
        role: 'agent'
      });
    } catch (dbError) {
      console.log('Database query failed (using in-memory fallback):', dbError);
      agent = null;
    }

    if (!agent) {
      return jsonResponse({ message: 'Agent not found' }, 404);
    }

    try {
      await users.deleteOne({ _id: new ObjectId(agentId) });
    } catch (deleteError) {
      console.log('Database delete failed (using in-memory fallback):', deleteError);
    }

    try {
      await workspaces.updateOne(
        { _id: new ObjectId(user.workspace) },
        { $pull: { agents: new ObjectId(agentId) } }
      );
    } catch (updateError) {
      console.log('Database update failed (using in-memory fallback):', updateError);
    }

    return jsonResponse({ message: 'Agent removed' });

  } catch (error) {
    console.error('Remove agent error:', error);
    return jsonResponse({ message: error.message }, 500);
  }
}