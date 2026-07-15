import { NextRequest, NextResponse } from "next/server";

// Interfaces
interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  cards?: any[];
  timestamp: string;
}

interface Document {
  id: string;
  name: string;
  status: "processing" | "verified" | "issue";
  note?: string;
  updatedAt: number;
}

interface Session {
  sessionId: string;
  serviceId: string;
  serviceName: string;
  agencyName: string;
  status: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  steps: Step[];
  messages: Message[];
  documents: Document[];
}

// Service Templates Catalog Configuration
const SERVICES_CATALOG: Record<string, Omit<Session, "sessionId" | "messages">> = {
  "passport-renewal": {
    serviceId: "passport-renewal",
    serviceName: "Passport Renewal",
    agencyName: "Department of Immigration & Emigration",
    status: "Eligibility Check",
    progress: 20,
    currentStep: 1,
    totalSteps: 5,
    steps: [
      { id: "1", label: "Eligibility Check", completed: false, current: true },
      { id: "2", label: "NIC Verification", completed: false, current: false },
      { id: "3", label: "Supporting Documents", completed: false, current: false },
      { id: "4", label: "Review & Confirm", completed: false, current: false },
      { id: "5", label: "Payment & Dispatch", completed: false, current: false }
    ],
    documents: [
      { id: "nic", name: "National Identity Card (NIC)", status: "processing", note: "Verifying...", updatedAt: Date.now() },
      { id: "bc", name: "Birth Certificate", status: "processing", note: "Awaiting upload...", updatedAt: Date.now() },
      { id: "photo", name: "Passport-sized Photograph", status: "processing", note: "Awaiting upload...", updatedAt: Date.now() }
    ]
  },
  "nic-application": {
    serviceId: "nic-application",
    serviceName: "New National Identity Card (NIC)",
    agencyName: "Department of Registration of Persons",
    status: "Biographic Details",
    progress: 20,
    currentStep: 1,
    totalSteps: 5,
    steps: [
      { id: "1", label: "Biographic Details", completed: false, current: true },
      { id: "2", label: "Civil Registry Verification", completed: false, current: false },
      { id: "3", label: "Local Officer Endorsement", completed: false, current: false },
      { id: "4", label: "Biometrics Capture Prep", completed: false, current: false },
      { id: "5", label: "Card Issuance", completed: false, current: false }
    ],
    documents: [
      { id: "bc", name: "Birth Certificate Copy", status: "processing", note: "Awaiting upload...", updatedAt: Date.now() },
      { id: "residency", name: "Grama Niladhari Certificate", status: "processing", note: "Awaiting upload...", updatedAt: Date.now() },
      { id: "photo", name: "IICA Photo Receipt (Physical)", status: "processing", note: "Awaiting upload...", updatedAt: Date.now() }
    ]
  },
  "birth-cert-copy": {
    serviceId: "birth-cert-copy",
    serviceName: "Birth Certificate Copy Request",
    agencyName: "Department of Registrar General",
    status: "Registry Details Check",
    progress: 20,
    currentStep: 1,
    totalSteps: 5,
    steps: [
      { id: "1", label: "Registry Details Check", completed: false, current: true },
      { id: "2", label: "Search Records", completed: false, current: false },
      { id: "3", label: "Registry Officer Approval", completed: false, current: false },
      { id: "4", label: "Certification Payment", completed: false, current: false },
      { id: "5", label: "Registry Copy Dispatch", completed: false, current: false }
    ],
    documents: [
      { id: "nic", name: "Requester National Identity Card (NIC)", status: "processing", note: "Verifying...", updatedAt: Date.now() },
      { id: "old_bc", name: "Original BC copy (if available)", status: "processing", note: "Awaiting upload...", updatedAt: Date.now() }
    ]
  }
};

// Generic Dispatcher initial state
const GENERAL_DISPATCHER: Omit<Session, "sessionId" | "messages"> = {
  serviceId: "general-dispatcher",
  serviceName: "GovPilot AI Central Dispatcher",
  agencyName: "Government of Sri Lanka",
  status: "Service Selection",
  progress: 10,
  currentStep: 1,
  totalSteps: 3,
  steps: [
    { id: "1", label: "State Citizen Request", completed: false, current: true },
    { id: "2", label: "Identify Service Agent", completed: false, current: false },
    { id: "3", label: "Initialize Service Workflow", completed: false, current: false }
  ],
  documents: []
};

// In-memory session store
const sessionsStore = new Map<string, Session>();

// Preseed one active session for Passport Renewal
sessionsStore.set("session-1", {
  sessionId: "session-1",
  serviceId: "passport-renewal",
  serviceName: "Passport Renewal",
  agencyName: "Department of Immigration & Emigration",
  status: "Document Verification",
  progress: 60,
  currentStep: 3,
  totalSteps: 5,
  steps: [
    { id: "1", label: "Eligibility Check", completed: true, current: false },
    { id: "2", label: "NIC Verification", completed: true, current: false },
    { id: "3", label: "Supporting Documents", completed: false, current: true },
    { id: "4", label: "Review & Confirm", completed: false, current: false },
    { id: "5", label: "Payment & Dispatch", completed: false, current: false }
  ],
  messages: [
    {
      id: "msg-1",
      sender: "agent",
      text: "Welcome to GovPilot AI Passport Renewal helper. Let's get started. First, we need to check your eligibility.",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "msg-2",
      sender: "user",
      text: "Yes, please. I need to renew my current passport.",
      timestamp: new Date(Date.now() - 3500000).toISOString()
    },
    {
      id: "msg-3",
      sender: "agent",
      text: "Excellent. I have verified that you are eligible for renewal. Here is our plan:",
      cards: [
        {
          type: "step_plan",
          steps: [
            { id: "1", label: "Eligibility Check", completed: true, current: false },
            { id: "2", label: "NIC Verification", completed: true, current: false },
            { id: "3", label: "Supporting Documents", completed: false, current: true },
            { id: "4", label: "Review & Confirm", completed: false, current: false },
            { id: "5", label: "Payment & Dispatch", completed: false, current: false }
          ]
        }
      ],
      timestamp: new Date(Date.now() - 3400000).toISOString()
    },
    {
      id: "msg-4",
      sender: "agent",
      text: "I have verified your National Identity Card (NIC) details. Please upload your Birth Certificate and a Passport-sized Photograph.",
      cards: [
        {
          type: "document_request",
          required: ["Birth Certificate", "Passport-sized Photograph"]
        }
      ],
      timestamp: new Date(Date.now() - 3300000).toISOString()
    }
  ],
  documents: [
    {
      id: "nic",
      name: "National Identity Card (NIC)",
      status: "verified",
      note: "Fetched from Department of Registration of Persons.",
      updatedAt: Date.now() - 3400000
    },
    {
      id: "bc",
      name: "Birth Certificate",
      status: "verified",
      note: "OCR verification successful.",
      updatedAt: Date.now() - 3300000
    },
    {
      id: "photo",
      name: "Passport-sized Photograph",
      status: "processing",
      note: "Awaiting photograph upload...",
      updatedAt: Date.now() - 3300000
    }
  ]
});

// Helpers
function getQueryParams(req: NextRequest) {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries());
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");

  // 1. GET api/proxy/sessions - list active citizen applications
  if (path === "sessions") {
    const list = Array.from(sessionsStore.values()).map(s => ({
      sessionId: s.sessionId,
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      status: s.status,
      progress: s.progress,
      updatedAt: new Date().toISOString()
    }));
    return NextResponse.json(list);
  }

  // 2. GET api/proxy/sessions/[sessionId] - single session info
  if (path.startsWith("sessions/")) {
    const sessionId = path.split("/")[1];
    const session = sessionsStore.get(sessionId);
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }
    return NextResponse.json(session);
  }

  // 3. GET api/proxy/chat/history - fetch messages
  if (path === "chat/history") {
    const { sessionId } = getQueryParams(req);
    const session = sessionsStore.get(sessionId);
    if (!session) {
      return NextResponse.json([]);
    }
    return NextResponse.json(session.messages);
  }

  // 4. GET api/proxy/documents - get document checklist
  if (path === "documents") {
    const { sessionId } = getQueryParams(req);
    const session = sessionsStore.get(sessionId);
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }
    
    // Simulate OCR processing: automatically verify after 6 seconds of upload
    let updated = false;
    const docs = session.documents.map(doc => {
      if (doc.status === "processing" && Date.now() - doc.updatedAt > 6000) {
        updated = true;
        return {
          ...doc,
          status: "verified" as const,
          note: `OCR verification successful for ${doc.name}. Checked and cross-referenced with civil databases.`,
          updatedAt: Date.now()
        };
      }
      return doc;
    });

    if (updated) {
      session.documents = docs;
      
      // If all documents are verified, update active stepper state
      const allVerified = docs.every(d => d.status === "verified");
      if (allVerified && session.serviceId !== "general-dispatcher") {
        session.progress = 80;
        session.status = "Review & Confirm";
        session.currentStep = 4;
        
        // Mark document step as complete, activate review step
        if (session.steps[2]) {
          session.steps[2].completed = true;
        }
        if (session.steps[3]) {
          session.steps[3].current = true;
        }

        // Add a message in history with confirmation card
        session.messages.push({
          id: `msg-ocr-${Date.now()}`,
          sender: "agent",
          text: `All uploaded documents for your ${session.serviceName} have been verified successfully via our automated OCR check. Please review your details and confirm.`,
          cards: [
            {
              type: "confirmation",
              summary: `${session.serviceName} Details\nRequester: K. L. Perera\nRef ID: SL-REF-10928\nProcessing Fee: ${session.serviceId === "passport-renewal" ? "LKR 10,000" : session.serviceId === "nic-application" ? "LKR 2,000" : "LKR 1,500"}`,
              action: "Submit Final Application"
            }
          ],
          timestamp: new Date().toISOString()
        });
      }
      sessionsStore.set(session.sessionId, session);
    }

    return NextResponse.json(docs);
  }

  // 5. GET api/proxy/documents/status - single OCR status
  if (path === "documents/status") {
    const { sessionId, docId } = getQueryParams(req);
    const session = sessionsStore.get(sessionId);
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }
    const doc = session.documents.find(d => d.id === docId);
    if (!doc) {
      return new NextResponse("Document not found", { status: 404 });
    }
    
    // Auto-verify helper if processing for long enough
    if (doc.status === "processing" && Date.now() - doc.updatedAt > 6000) {
      doc.status = "verified";
      doc.note = `OCR scanner verified ${doc.name} successfully.`;
      doc.updatedAt = Date.now();
      
      const allVerified = session.documents.every(d => d.status === "verified");
      if (allVerified && session.serviceId !== "general-dispatcher") {
        session.progress = 80;
        session.status = "Review & Confirm";
        session.currentStep = 4;
        if (session.steps[2]) session.steps[2].completed = true;
        if (session.steps[3]) session.steps[3].current = true;
        
        session.messages.push({
          id: `msg-ocr-${Date.now()}`,
          sender: "agent",
          text: `All uploaded documents for your ${session.serviceName} have been verified successfully via our automated OCR check. Please review your details and confirm.`,
          cards: [
            {
              type: "confirmation",
              summary: `${session.serviceName} Details\nRequester: K. L. Perera\nRef ID: SL-REF-10928\nProcessing Fee: ${session.serviceId === "passport-renewal" ? "LKR 10,000" : session.serviceId === "nic-application" ? "LKR 2,000" : "LKR 1,500"}`,
              action: "Submit Final Application"
            }
          ],
          timestamp: new Date().toISOString()
        });
      }
      sessionsStore.set(session.sessionId, session);
    }
    
    return NextResponse.json(doc);
  }

  // 6. GET api/proxy/chat/stream - SSE chat responses stream (Service Agnostic Dispatcher)
  if (path === "chat/stream") {
    const { sessionId, message } = getQueryParams(req);
    const session = sessionsStore.get(sessionId);
    
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }

    // Save user message
    session.messages.push({
      id: `msg-u-${Date.now()}`,
      sender: "user",
      text: message,
      timestamp: new Date().toISOString()
    });

    let replyText = "";
    let cards: any[] = [];
    const lowerMessage = message.toLowerCase();

    // CASE 1: Session is currently in General Dispatcher mode.
    // Conversational agent detects service intent and dynamically loads configuration.
    if (session.serviceId === "general-dispatcher") {
      let matchedServiceKey = "";

      if (lowerMessage.includes("passport") || lowerMessage.includes("renew")) {
        matchedServiceKey = "passport-renewal";
      } else if (lowerMessage.includes("nic") || lowerMessage.includes("identity") || lowerMessage.includes("id card")) {
        matchedServiceKey = "nic-application";
      } else if (lowerMessage.includes("birth") || lowerMessage.includes("certificate")) {
        matchedServiceKey = "birth-cert-copy";
      }

      if (matchedServiceKey) {
        // Load configurations dynamically
        const serviceTemplate = SERVICES_CATALOG[matchedServiceKey];
        session.serviceId = serviceTemplate.serviceId;
        session.serviceName = serviceTemplate.serviceName;
        session.agencyName = serviceTemplate.agencyName;
        session.status = serviceTemplate.status;
        session.progress = serviceTemplate.progress;
        session.currentStep = serviceTemplate.currentStep;
        session.totalSteps = serviceTemplate.totalSteps;
        session.steps = JSON.parse(JSON.stringify(serviceTemplate.steps));
        session.documents = JSON.parse(JSON.stringify(serviceTemplate.documents));

        replyText = `I have identified that you need assistance with ${session.serviceName}. I am initializing the official workspace under the ${session.agencyName}. First, I am setting up your steps plan.`;
        cards = [
          {
            type: "step_plan",
            steps: session.steps
          }
        ];

        // Trigger dynamic auto-verification for NIC or documents if applicable
        setTimeout(() => {
          const s = sessionsStore.get(sessionId);
          if (s) {
            // Auto verify first document (e.g. NIC or Birth Certificate checks) after 5s
            if (s.documents[0]) {
              s.documents[0].status = "verified";
              s.documents[0].note = "Automatically verified against government civil registers.";
            }
            s.steps[0].completed = true;
            s.steps[1].current = true;
            s.currentStep = 2;
            s.progress = 40;
            s.status = "Document Checks";
            
            const requiredDocs = s.documents.filter(d => d.status !== "verified").map(d => d.name);

            s.messages.push({
              id: `msg-auto-verified-${Date.now()}`,
              sender: "agent",
              text: `I have automatically verified your primary records against our database. We are now on Step 2. Please upload the remaining files in the Documents portal:`,
              cards: [
                {
                  type: "document_request",
                  required: requiredDocs
                }
              ],
              timestamp: new Date().toISOString()
            });
            sessionsStore.set(sessionId, s);
          }
        }, 5000);

      } else {
        replyText = "Hello! I am your GovPilot AI central dispatcher. I can launch official portals for Passport Renewal, National Identity Card (NIC) requests, or Birth Certificate Copy requests. Please state which service you need.";
      }
    } 
    // CASE 2: Session is already in a specific service workflow
    else {
      if (lowerMessage.includes("submit") || lowerMessage.includes("confirm") || lowerMessage.includes("pay")) {
        replyText = `Thank you for confirming. I have successfully submitted your ${session.serviceName} request to the ${session.agencyName}. Your tracking reference code is SL-TRK-${Math.floor(100000 + Math.random() * 900000)}. You will receive updates via SMS.`;
        session.progress = 100;
        session.status = "Completed";
        session.currentStep = session.totalSteps;
        session.steps = session.steps.map(s => ({ ...s, completed: true, current: false }));
        cards = [
          {
            type: "document_status",
            doc: "Application Registry Submission",
            status: "verified",
            note: "Forwarded to department systems. Scheduled processing: within 48h."
          }
        ];
      } else {
        const requiredDocs = session.documents.filter(d => d.status !== "verified").map(d => d.name);
        if (requiredDocs.length > 0) {
          replyText = `I have logged your request. Please open the Document Upload portal and submit the remaining required files to run OCR checks.`;
          cards = [
            {
              type: "document_request",
              required: requiredDocs
            }
          ];
        } else {
          replyText = `I have received your response: "${message}". We have verified all required documents and are ready for final submission. Please review and confirm below.`;
          cards = [
            {
              type: "confirmation",
              summary: `${session.serviceName} Summary\nRequester: K. L. Perera\nAddress: Colombo, Sri Lanka\nFee: ${session.serviceId === "passport-renewal" ? "LKR 10,000" : "LKR 2,000"}`,
              action: "Submit Final Application"
            }
          ];
        }
      }
    }

    // SSE Stream
    const encoder = new TextEncoder();
    const words = replyText.split(" ");
    
    const stream = new ReadableStream({
      async start(controller) {
        let accumulatedText = "";
        for (let i = 0; i < words.length; i++) {
          accumulatedText += (i === 0 ? "" : " ") + words[i];
          const payload = {
            reply_text: accumulatedText,
            current_step: session.currentStep,
            total_steps: session.totalSteps,
            cards: i === words.length - 1 ? cards : undefined
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          await new Promise(r => setTimeout(r, 50));
        }
        
        // Save agent message to history
        session.messages.push({
          id: `msg-a-${Date.now()}`,
          sender: "agent",
          text: replyText,
          cards: cards,
          timestamp: new Date().toISOString()
        });
        sessionsStore.set(session.sessionId, session);
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  }

  return new NextResponse("Not Found", { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");

  // 1. POST api/proxy/sessions/new - create a new service session (Passport, NIC, BirthCert or Dispatcher)
  if (path === "sessions/new") {
    const { serviceId } = getQueryParams(req);
    const newSessionId = `session-${Math.random().toString(36).substring(2, 9)}`;
    
    let template = GENERAL_DISPATCHER;
    if (serviceId && SERVICES_CATALOG[serviceId]) {
      template = SERVICES_CATALOG[serviceId];
    }

    // Create session from template deep copy
    const newSession: Session = {
      sessionId: newSessionId,
      serviceId: template.serviceId,
      serviceName: template.serviceName,
      agencyName: template.agencyName,
      status: template.status,
      progress: template.progress,
      currentStep: template.currentStep,
      totalSteps: template.totalSteps,
      steps: JSON.parse(JSON.stringify(template.steps)),
      documents: JSON.parse(JSON.stringify(template.documents)),
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: "agent",
          text: template.serviceId === "general-dispatcher" 
            ? "Welcome to GovPilot AI! I am the centralized government services assistant for Sri Lanka. I can help you with Passport Renewal, new National Identity Card (NIC) requests, or Birth Certificate copies. What service do you need today?"
            : `Welcome to GovPilot AI! I will help you with your ${template.serviceName} application. Let's start by establishing our steps.`,
          cards: [
            {
              type: "step_plan",
              steps: JSON.parse(JSON.stringify(template.steps))
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    sessionsStore.set(newSessionId, newSession);

    // Dynamic auto-verification helper for specific services (NIC / Passport)
    if (newSession.serviceId !== "general-dispatcher") {
      setTimeout(() => {
        const s = sessionsStore.get(newSessionId);
        if (s) {
          if (s.documents[0]) {
            s.documents[0].status = "verified";
            s.documents[0].note = "Verified successfully against civil records databases.";
          }
          s.steps[0].completed = true;
          s.steps[1].current = true;
          s.currentStep = 2;
          s.progress = 40;
          s.status = "NIC Verification";
          
          const remainingDocs = s.documents.filter(d => d.status !== "verified").map(d => d.name);

          s.messages.push({
            id: `msg-auto-verified-${Date.now()}`,
            sender: "agent",
            text: `I have automatically verified your primary records. We are now on Step 2. Please upload the remaining required files in the Documents upload desk to continue:`,
            cards: [
              {
                type: "document_request",
                required: remainingDocs
              }
            ],
            timestamp: new Date().toISOString()
          });
          sessionsStore.set(newSessionId, s);
        }
      }, 4000);
    }

    return NextResponse.json(newSession);
  }

  // 2. POST api/proxy/documents/upload - mock file upload
  if (path === "documents/upload") {
    try {
      const formData = await req.formData();
      const sessionId = formData.get("sessionId") as string;
      const docId = formData.get("docId") as string;

      const session = sessionsStore.get(sessionId);
      if (!session) {
        return new NextResponse("Session not found", { status: 404 });
      }

      const docIndex = session.documents.findIndex(d => d.id === docId);
      if (docIndex === -1) {
        return new NextResponse("Document not found in checklist", { status: 404 });
      }

      // Mark document as processing OCR check
      session.documents[docIndex].status = "processing";
      session.documents[docIndex].note = "OCR scanning in progress... Checking authenticity.";
      session.documents[docIndex].updatedAt = Date.now();

      const file = formData.get("file") as File;
      if (file && file.name.toLowerCase().includes("error")) {
        session.documents[docIndex].status = "issue";
        session.documents[docIndex].note = "OCR extraction failed. Image quality or details are unclear. Please upload a high-resolution, clear copy.";
        session.messages.push({
          id: `msg-upload-err-${Date.now()}`,
          sender: "agent",
          text: `There was a verification issue with your uploaded ${session.documents[docIndex].name}. The OCR scan failed to read clear details. Please submit a clearer image.`,
          cards: [
            {
              type: "document_status",
              doc: session.documents[docIndex].name,
              status: "issue",
              note: "Verification check failed. Please ensure file text is clearly visible and legible."
            }
          ],
          timestamp: new Date().toISOString()
        });
      }

      sessionsStore.set(sessionId, session);
      return NextResponse.json({ success: true, doc: session.documents[docIndex] });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}
