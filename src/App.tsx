import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bot,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  EyeOff,
  Fingerprint,
  FileText,
  Globe,
  History,
  Home,
  Landmark,
  Languages,
  Lock,
  LogOut,
  MapPin,
  Pill,
  Save,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  Upload,
  User,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

const COLORS = {
  primary: "#2F80ED",
  success: "#27AE60",
  bg: "#F5F7FA",
  text: "#1F2937",
  subtext: "#6B7280",
  border: "#E5E7EB",
  card: "#FFFFFF",
  warning: "#F2A93B",
  danger: "#D64545",
};

const ROLE_META = {
  consumer: {
    label: "Consumer",
    icon: User,
    access: "Personal medicine verification",
  },
  pharmacist: {
    label: "Pharmacist",
    icon: Pill,
    access: "Dispensing and batch review",
  },
  healthcare: {
    label: "Healthcare Professional",
    icon: Stethoscope,
    access: "Clinical verification workflow",
  },
  regulator: {
    label: "Regulatory Officer",
    icon: Landmark,
    access: "Market surveillance reports",
  },
  admin: {
    label: "Admin",
    icon: Settings,
    access: "Enterprise system controls",
  },
};

type UserRole = keyof typeof ROLE_META;
type Screen =
  | "home"
  | "scan"
  | "history"
  | "alerts"
  | "reports"
  | "settings"
  | "result"
  | "report"
  | "offline";
type SettingsDetail =
  | "privacy"
  | "language"
  | "verification"
  | "guest"
  | null;
type VerificationStatus = "Authentic" | "Suspicious" | "Counterfeit";
type User = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
};
type SessionUser = Omit<User, "password">;
type HistoryItem = {
  id: string;
  medicine: string;
  batch: string;
  status: VerificationStatus;
  date: string;
};
type VerificationResult = {
  medicine: string;
  batch: string;
  manufacturer: string;
  expiry: string;
  status: VerificationStatus;
  confidence: string;
};
type AlertItem = {
  id: string;
  message: string;
  severity: "High" | "Medium" | "Low";
};
type ReportItem = {
  id: string;
  title: string;
  date: string;
};
type ChatMessage = {
  id: string;
  sender: "assistant" | "user";
  text: string;
};

const INITIAL_USERS: User[] = [
  {
    name: "Hannah Consumer",
    email: "consumer@wissenmedauth.app",
    password: "consumer123",
    role: "consumer",
  },
  {
    name: "Paul Pharma",
    email: "pharmacist@wissenmedauth.app",
    password: "pharma123",
    role: "pharmacist",
  },
  {
    name: "Dr. Elvie",
    email: "healthcare@wissenmedauth.app",
    password: "health123",
    role: "healthcare",
  },
  {
    name: "Riley Regulator",
    email: "regulator@wissenmedauth.app",
    password: "reg123",
    role: "regulator",
  },
  {
    name: "Admin User",
    email: "admin@wissenmedauth.app",
    password: "admin123",
    role: "admin",
  },
];

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: "VH-1001",
    medicine: "Paracetamol 500mg",
    batch: "B-84921",
    status: "Authentic",
    date: "2026-04-20 09:45",
  },
  {
    id: "VH-1002",
    medicine: "Amoxicillin 250mg",
    batch: "B-29111",
    status: "Suspicious",
    date: "2026-04-19 14:30",
  },
  {
    id: "VH-1003",
    medicine: "Ibuprofen 200mg",
    batch: "B-11883",
    status: "Counterfeit",
    date: "2026-04-18 17:05",
  },
];

const ALERTS: AlertItem[] = [
  {
    id: "AL-401",
    message: "Suspicious batch detected in Manila",
    severity: "High",
  },
  {
    id: "AL-402",
    message: "Offline sync pending for 12 records",
    severity: "Medium",
  },
  {
    id: "AL-403",
    message: "Manufacturer data update received",
    severity: "Low",
  },
];

const REPORTS: ReportItem[] = [
  { id: "RP-301", title: "Counterfeit activity summary", date: "2026-04-21" },
  { id: "RP-302", title: "Regional verification report", date: "2026-04-20" },
  { id: "RP-303", title: "Batch incident overview", date: "2026-04-19" },
];

const SESSION_KEY = "medauthPrototypeSession";

function isScreenAllowed(screen: Screen, role: UserRole, isGuest: boolean) {
  const alwaysAllowed: Screen[] = ["result", "offline"];
  if (alwaysAllowed.includes(screen)) return true;
  if (screen === "report") return !isGuest;
  return getNavItems(role, isGuest).includes(screen);
}

function getStoredSession(): {
  user: SessionUser;
  isGuest: boolean;
  screen: Screen;
} | null {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession);
    const role = session?.user?.role as UserRole | undefined;
    if (!role || !ROLE_META[role]) return null;

    const screen = (session.screen || getDashboardScreen(role)) as Screen;
    const isGuest = Boolean(session.isGuest);

    return {
      user: {
        name: session.user.name || "MedAuth User",
        email: session.user.email || "",
        role,
      },
      isGuest,
      screen: isScreenAllowed(screen, role, isGuest)
        ? screen
        : getDashboardScreen(role),
    };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

const NAV_META = {
  home: { label: "Home", icon: Home },
  scan: { label: "Scan", icon: Camera },
  history: { label: "History", icon: History },
  alerts: { label: "Alerts", icon: Bell },
  reports: { label: "Reports", icon: FileText },
  settings: { label: "Settings", icon: Settings },
};

function getStatusConfig(status: VerificationStatus) {
  if (status === "Authentic") {
    return {
      icon: ShieldCheck,
      color: COLORS.success,
      bg: "#EAF8F0",
      note: "This medicine matches registered medication, batch, and verification records.",
    };
  }
  if (status === "Suspicious") {
    return {
      icon: ShieldAlert,
      color: COLORS.warning,
      bg: "#FFF7E8",
      note: "Some details could not be fully validated. Additional review is recommended.",
    };
  }
  return {
    icon: ShieldX,
    color: COLORS.danger,
    bg: "#FDECEC",
    note: "This medicine may be unsafe or counterfeit. Do not use or dispense it.",
  };
}

function getNavItems(role: UserRole, isGuest: boolean): Screen[] {
  if (isGuest) return ["home", "scan", "settings"];
  if (role === "consumer") return ["home", "scan", "history", "settings"];
  if (role === "pharmacist" || role === "healthcare") {
    return ["home", "scan", "history", "alerts", "settings"];
  }
  if (role === "regulator" || role === "admin") {
    return ["home", "reports", "alerts", "settings"];
  }
  return ["home", "scan", "settings"];
}

function getDashboardScreen(role: UserRole): Screen {
  return "home";
}

type DashboardCard = {
  title: string;
  description: string;
  metric: string;
  badge: string;
  tone: "primary" | "success" | "warning" | "danger" | "neutral";
  icon: typeof Camera;
  screen: Screen;
};

const DASHBOARD_CARDS: Record<UserRole, DashboardCard[]> = {
  consumer: [
    {
      title: "Scan Medicine",
      description: "Verify product authenticity from barcode or manual code.",
      metric: "98%",
      badge: "Ready",
      tone: "primary",
      icon: Camera,
      screen: "scan",
    },
    {
      title: "Recent Verification",
      description: "Review your latest medication checks and outcomes.",
      metric: "3",
      badge: "Updated",
      tone: "success",
      icon: History,
      screen: "history",
    },
    {
      title: "Safety Guidance",
      description: "See handling guidance for verified or suspicious products.",
      metric: "24/7",
      badge: "Guidance",
      tone: "success",
      icon: ShieldCheck,
      screen: "result",
    },
    {
      title: "Report Suspicious Product",
      description: "Submit packaging, batch, or counterfeit concerns.",
      metric: "1 min",
      badge: "Escalate",
      tone: "warning",
      icon: ShieldAlert,
      screen: "report",
    },
  ],
  pharmacist: [
    {
      title: "Verify Before Dispensing",
      description: "Confirm medicine status before patient handoff.",
      metric: "Live",
      badge: "Dispense",
      tone: "primary",
      icon: ClipboardCheck,
      screen: "scan",
    },
    {
      title: "Batch Lookup",
      description: "Search batch records and recent verification history.",
      metric: "3",
      badge: "Indexed",
      tone: "success",
      icon: Search,
      screen: "history",
    },
    {
      title: "Suspicious Alerts",
      description: "Monitor high-priority product warnings and recalls.",
      metric: "1 high",
      badge: "Review",
      tone: "danger",
      icon: Bell,
      screen: "alerts",
    },
    {
      title: "Offline Sync Status",
      description: "Track cached verifications waiting for synchronization.",
      metric: "12",
      badge: "Pending",
      tone: "warning",
      icon: WifiOff,
      screen: "offline",
    },
  ],
  healthcare: [
    {
      title: "Medicine Safety Check",
      description: "Validate authenticity before clinical recommendations.",
      metric: "98%",
      badge: "Clinical",
      tone: "primary",
      icon: Stethoscope,
      screen: "scan",
    },
    {
      title: "Verification History",
      description: "Review prior medication status checks and audit notes.",
      metric: "3",
      badge: "Tracked",
      tone: "success",
      icon: History,
      screen: "history",
    },
    {
      title: "Patient Safety Notes",
      description: "Reference handling advice for suspicious results.",
      metric: "Active",
      badge: "Care",
      tone: "success",
      icon: FileText,
      screen: "result",
    },
    {
      title: "Clinical Alert Review",
      description: "Assess warnings that may affect patient medication use.",
      metric: "3",
      badge: "Alerts",
      tone: "warning",
      icon: TriangleAlert,
      screen: "alerts",
    },
  ],
  regulator: [
    {
      title: "Counterfeit Alerts",
      description: "Prioritize suspected counterfeit signals by severity.",
      metric: "1 high",
      badge: "Critical",
      tone: "danger",
      icon: ShieldX,
      screen: "alerts",
    },
    {
      title: "Verification Analytics",
      description: "Inspect verification volume and status distribution.",
      metric: "1.2k",
      badge: "Live",
      tone: "primary",
      icon: ClipboardCheck,
      screen: "reports",
    },
    {
      title: "Regional Monitoring",
      description: "Monitor product risk patterns across operating regions.",
      metric: "5",
      badge: "Regions",
      tone: "success",
      icon: Globe,
      screen: "alerts",
    },
    {
      title: "Regulatory Report Generator",
      description: "Prepare compliance summaries and incident reports.",
      metric: "3",
      badge: "Reports",
      tone: "warning",
      icon: FileText,
      screen: "reports",
    },
  ],
  admin: [
    {
      title: "User Management",
      description: "Manage role access and enterprise account status.",
      metric: "5",
      badge: "Roles",
      tone: "primary",
      icon: User,
      screen: "settings",
    },
    {
      title: "Audit Logs",
      description: "Review system access and verification event records.",
      metric: "248",
      badge: "Logged",
      tone: "success",
      icon: FileText,
      screen: "reports",
    },
    {
      title: "Sync Monitoring",
      description: "Track offline queue health and synchronization events.",
      metric: "12",
      badge: "Queue",
      tone: "warning",
      icon: Wifi,
      screen: "offline",
    },
    {
      title: "System Health",
      description: "Monitor uptime, authentication, and service readiness.",
      metric: "99.9%",
      badge: "Healthy",
      tone: "success",
      icon: ShieldCheck,
      screen: "alerts",
    },
  ],
};

function getScreenTitle(screen: Screen, roleLabel: string) {
  if (screen === "home") return "Dashboard";
  if (screen === "scan") return "Medication Scan";
  if (screen === "result") return "Verification Result";
  if (screen === "report") return "Incident Report";
  if (screen === "offline") return "Offline Verification";
  if (screen === "history") return "Verification History";
  if (screen === "alerts") return `${roleLabel} Alerts`;
  if (screen === "reports") return `${roleLabel} Reports`;
  return "Settings";
}

function getSettingsDetailTitle(detail: SettingsDetail) {
  if (detail === "privacy") return "Privacy and Security";
  if (detail === "language") return "Language Preferences";
  if (detail === "verification") return "Verification Preferences";
  if (detail === "guest") return "Guest Access";
  return "Settings";
}

const AI_PROMPTS = [
  "Explain this verification result",
  "Explain counterfeit warning",
  "Explain offline mode limitation",
  "Explain blockchain validation",
  "Generate a regulatory summary",
  "Summarise audit trail",
];

const AI_PROTOTYPE_LABEL = "Prototype AI Assistant – simulated responses only.";

function getRoleAiLens(role: UserRole) {
  if (role === "pharmacist") {
    return "Pharmacist focus: verify the batch, retain packaging, check dispensing eligibility, and escalate any mismatch before release.";
  }
  if (role === "healthcare") {
    return "Healthcare Professional focus: treat authenticity as part of clinical safety context and avoid patient use when verification is uncertain.";
  }
  if (role === "regulator") {
    return "Regulatory Officer focus: review alert priority, affected batch evidence, market surveillance impact, and reporting completeness.";
  }
  if (role === "admin") {
    return "Admin focus: inspect system logs, offline sync queues, access activity, and audit evidence for compliance support.";
  }
  return "Consumer focus: keep the medicine sealed, do not use it if warnings appear, and ask a pharmacist or healthcare professional for help.";
}

function getAiResponse(
  prompt: string,
  role: UserRole,
  result: VerificationResult,
  screen: Screen,
  online: boolean,
  history: HistoryItem[]
) {
  // Prototype-only AI simulation: no API keys, network calls, or external AI
  // services are used in the browser. A real AI integration would require a
  // secure backend API layer to protect secrets and enforce authorization.
  const roleLens = getRoleAiLens(role);
  const statusConfig = getStatusConfig(result.status);
  const latestHistory = history[0];

  if (prompt.includes("counterfeit") || prompt.includes("suspicious")) {
    return `${roleLens} Counterfeit warning explanation: the simulated warning is triggered when batch, manufacturer, barcode, expiry, packaging, or blockchain records do not fully align. Current mock signal: ${result.status} with ${result.confidence} confidence for batch ${result.batch}. Recommended prototype action: isolate the product, preserve evidence, avoid dispensing or use, and submit a report if the concern remains.`;
  }

  if (prompt.includes("offline")) {
    return `${roleLens} Offline mode limitation: this prototype uses mock cached verification data only. It can show a preliminary status, but it cannot confirm newest manufacturer updates, blockchain events, or regulatory alerts until a real secure sync layer exists. Current connectivity is ${online ? "online in the UI simulation" : "offline in the UI simulation, so treat results as limited"}.`;
  }

  if (prompt.includes("regulatory")) {
    return `${roleLens} Regulatory summary: ${result.medicine}, batch ${result.batch}, manufacturer ${result.manufacturer}, status ${result.status}, confidence ${result.confidence}. Mock filing note: ${statusConfig.note} Include barcode evidence, location, timestamps, user role, and any offline sync status before escalation.`;
  }

  if (prompt.includes("blockchain")) {
    return `${roleLens} Blockchain validation status: this prototype simulates comparing the scanned batch against tamper-resistant product events such as manufacturer registration, distribution handoff, and verification history. Batch ${result.batch} is shown as ${result.status === "Authentic" ? "matching the mock chain of custody" : "requiring review because one or more mock chain records may be incomplete or inconsistent"}.`;
  }

  if (prompt.includes("audit")) {
    return `${roleLens} Audit trail summary: latest mock event ${latestHistory?.id || "N/A"} recorded ${latestHistory?.medicine || result.medicine} as ${latestHistory?.status || result.status}. Compliance monitoring should capture user role, verification status, timestamp, scan source, report submission, and pending offline synchronization records.`;
  }

  return `${roleLens} Verification result explanation: ${result.medicine} batch ${result.batch} is currently marked ${result.status} with ${result.confidence} confidence using local mock data. ${statusConfig.note} Next recommended prototype action: ${
    result.status === "Authentic"
      ? "continue normal handling while checking expiry and packaging."
      : result.status === "Suspicious"
      ? "pause use or dispensing, inspect packaging, and escalate for review."
      : "do not use or dispense; quarantine the item and submit an incident report."
  }`;
}

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [authMode, setAuthMode] = useState("welcome");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [settingsDetail, setSettingsDetail] = useState<SettingsDetail>(null);
  const [online, setOnline] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole | "">("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [newForgotPassword, setNewForgotPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [scanInput, setScanInput] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "ai-welcome",
      sender: "assistant",
      text: "Prototype AI assistance is ready. Responses are generated locally from predefined MedAuth scenarios, with no external AI service or API key.",
    },
  ]);

  const [verificationResult, setVerificationResult] = useState<VerificationResult>({
    medicine: "Paracetamol 500mg",
    batch: "B-84921",
    manufacturer: "WissenMedAuth Pharma",
    expiry: "2027-10-31",
    status: "Authentic",
    confidence: "98%",
  });

  const currentRole = currentUser?.role || "consumer";
  const roleMeta = useMemo(
    () => ROLE_META[currentRole] || ROLE_META.consumer,
    [currentRole]
  );
  const navItems = getNavItems(currentRole, isGuest);

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      const selectedRole = localStorage.getItem("medauthSelectedRole");
      if (selectedRole && ROLE_META[selectedRole as UserRole]) {
        setLoginRole(selectedRole as UserRole);
      }
      return;
    }

    setCurrentUser(storedSession.user);
    setIsGuest(storedSession.isGuest);
    setIsLoggedIn(true);
    setScreen(storedSession.screen);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    if (!isScreenAllowed(screen, currentUser.role, isGuest)) {
      setScreen(getDashboardScreen(currentUser.role));
      return;
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: currentUser,
        isGuest,
        screen,
      })
    );
  }, [currentUser, isGuest, isLoggedIn, screen]);

  useEffect(() => {
    if (screen !== "settings") setSettingsDetail(null);
  }, [screen]);

  const resetAuthMessages = () => {
    setLoginError("");
    setSignupError("");
    setSignupSuccess("");
    setForgotError("");
    setForgotMessage("");
  };

  const handleLogin = () => {
    if (loginLoading) return;

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    setLoginError("");

    if (!email) {
      setLoginError("Email is required.");
      return;
    }

    if (!password) {
      setLoginError("Password is required.");
      return;
    }

    if (!loginRole) {
      setLoginError("Please select a role.");
      return;
    }

    const matchedUser = users.find(
      (user) =>
        user.email.toLowerCase() === email &&
        user.password === password &&
        user.role === loginRole
    );

    if (!matchedUser) {
      setLoginError("The credentials do not match the selected access role.");
      return;
    }

    const sessionUser: SessionUser = {
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
    };
    const dashboardScreen = getDashboardScreen(loginRole);

    setLoginLoading(true);
    window.setTimeout(() => {
      setCurrentUser(sessionUser);
      setIsGuest(false);
      setIsLoggedIn(true);
      setScreen(dashboardScreen);
      setAuthMode("welcome");
      setLoginError("");
      setLoginLoading(false);
      localStorage.setItem("medauthSelectedRole", loginRole);
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          user: sessionUser,
          isGuest: false,
          screen: dashboardScreen,
        })
      );
    }, 750);
  };

  const handleGuest = () => {
    const guestUser: SessionUser = {
      name: "Guest User",
      email: "",
      role: "consumer",
    };
    setCurrentUser(guestUser);
    setIsGuest(true);
    setIsLoggedIn(true);
    setScreen("home");
    setAuthMode("welcome");
    setLoginError("");
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: guestUser,
        isGuest: true,
        screen: "home",
      })
    );
  };

  const handleSignup = () => {
    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword.trim();

    if (!name || !email || !password) {
      setSignupError("Please complete all fields.");
      setSignupSuccess("");
      return;
    }

    const exists = users.some((user) => user.email.toLowerCase() === email);
    if (exists) {
      setSignupError("An account with this email already exists.");
      setSignupSuccess("");
      return;
    }

    const newUser = {
      name,
      email,
      password,
      role: "consumer" as const,
    };

    setUsers((prev) => [...prev, newUser]);
    setSignupError("");
    setSignupSuccess(
      "Consumer account created successfully. You can now log in."
    );
    setLoginEmail(email);
    setLoginPassword(password);
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
  };

  const handleForgotPassword = () => {
    const email = forgotEmail.trim().toLowerCase();
    const newPassword = newForgotPassword.trim();

    if (!email || !newPassword) {
      setForgotError("Please enter your email and a new password.");
      setForgotMessage("");
      return;
    }

    const found = users.find((user) => user.email.toLowerCase() === email);
    if (!found) {
      setForgotError("No account was found for this email address.");
      setForgotMessage("");
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.email.toLowerCase() === email
          ? { ...user, password: newPassword }
          : user
      )
    );

    setForgotError("");
    setForgotMessage("Password updated successfully. You can now log in.");
    setLoginEmail(email);
    setLoginPassword(newPassword);
    setNewForgotPassword("");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsGuest(false);
    setCurrentUser(null);
    setScreen("home");
    setAiOpen(false);
    setAuthMode("welcome");
    setLoginPassword("");
    setLoginRole("");
    localStorage.removeItem("medauthSelectedRole");
    localStorage.removeItem("medauthDashboard");
    localStorage.removeItem(SESSION_KEY);
    resetAuthMessages();
  };

  const handleGuestBackToWelcome = () => {
    setIsLoggedIn(false);
    setIsGuest(false);
    setCurrentUser(null);
    setScreen("home");
    setAiOpen(false);
    setAuthMode("welcome");
    localStorage.removeItem(SESSION_KEY);
    resetAuthMessages();
  };

  const handleGuestAuth = (mode: "welcome" | "signup") => {
    setIsLoggedIn(false);
    setIsGuest(false);
    setCurrentUser(null);
    setScreen("home");
    setSettingsDetail(null);
    setAiOpen(false);
    setAuthMode(mode);
    localStorage.removeItem(SESSION_KEY);
    resetAuthMessages();
  };

  const handleVerify = () => {
    const input = scanInput.trim().toLowerCase();

    if (!online) {
      setScreen("offline");
      return;
    }

    let result: VerificationResult;
    if (input.includes("fake") || input.includes("x9")) {
      result = {
        medicine: "Unknown Product",
        batch: "X9-0001",
        manufacturer: "Unverified",
        expiry: "Not Available",
        status: "Counterfeit",
        confidence: "27%",
      };
    } else if (input.includes("warn") || input.includes("sus")) {
      result = {
        medicine: "Amoxicillin 250mg",
        batch: "B-29111",
        manufacturer: "MediCore Ltd.",
        expiry: "2026-12-15",
        status: "Suspicious",
        confidence: "63%",
      };
    } else {
      result = {
        medicine: "Paracetamol 500mg",
        batch: "B-84921",
        manufacturer: "WissenMedAuth Pharma",
        expiry: "2027-10-31",
        status: "Authentic",
        confidence: "98%",
      };
    }

    setVerificationResult(result);
    setHistory((prev) => [
      {
        id: `VH-${1000 + prev.length + 1}`,
        medicine: result.medicine,
        batch: result.batch,
        status: result.status,
        date: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setScreen("result");
  };

  const submitReport = () => {
    if (isGuest) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportText("");
      setScreen("history");
    }, 1200);
  };

  const handleAiPrompt = (prompt: string) => {
    if (aiTyping) return;

    // Keep assistant behavior client-safe: selected prompts are answered by
    // local mock logic only. Real AI must be proxied through a secure backend.
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: prompt,
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiTyping(true);

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: getAiResponse(
          prompt.toLowerCase(),
          currentRole,
          verificationResult,
          screen,
          online,
          history
        ),
      };
      setAiMessages((prev) => [...prev, assistantMessage]);
      setAiTyping(false);
    }, 850);
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.appShell}>
        <PhoneFrame>
          <StatusBar online={online} />
          <AppLoginScreen
            email={loginEmail}
            setEmail={setLoginEmail}
            password={loginPassword}
            setPassword={setLoginPassword}
            role={loginRole}
            setRole={setLoginRole}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={loginError}
            isLoading={loginLoading}
            onLogin={handleLogin}
            onGuest={handleGuest}
          />
        </PhoneFrame>
      </div>
    );
  }

  return (
    <div style={styles.appShell}>
      <PhoneFrame>
        <StatusBar online={online} />
        <div style={styles.screenWrap}>
          <TopBar
            title={
              screen === "settings" && settingsDetail
                ? getSettingsDetailTitle(settingsDetail)
                : getScreenTitle(screen, roleMeta.label)
            }
            onBack={
              screen === "settings" && settingsDetail
                ? () => setSettingsDetail(null)
                : screen !== "home"
                ? () => setScreen("home")
                : undefined
            }
          />

          <div style={styles.contentArea}>
            {isGuest && (
              <div style={styles.guestBanner}>
                Guest access is limited to medication scanning, verification
                results, and basic settings. Reporting, history, alerts, and
                dashboards require a registered account.
              </div>
            )}

            {screen === "home" && (
              <HomeScreen
                roleMeta={roleMeta}
                online={online}
                onToggleOnline={() => setOnline((v) => !v)}
                onNavigate={setScreen}
                isGuest={isGuest}
                currentRole={currentRole}
                onGuestBack={handleGuestBackToWelcome}
              />
            )}

            {screen === "scan" && (
              <ScanScreen
                scanInput={scanInput}
                setScanInput={setScanInput}
                onVerify={handleVerify}
                online={online}
              />
            )}

            {screen === "result" && (
              <ResultScreen
                result={verificationResult}
                role={currentRole}
                isGuest={isGuest}
                onReport={() => {
                  if (!isGuest) setScreen("report");
                }}
              />
            )}

            {screen === "report" && !isGuest && (
              <ReportScreen
                reportText={reportText}
                setReportText={setReportText}
                onSubmit={submitReport}
                reportSubmitted={reportSubmitted}
              />
            )}

            {screen === "offline" && (
              <OfflineScreen
                onSync={() => setScreen(isGuest ? "home" : "history")}
              />
            )}

            {screen === "history" && !isGuest && (
              <HistoryScreen history={history} />
            )}

            {screen === "alerts" && !isGuest && (
              <AlertsScreen alerts={ALERTS} roleLabel={roleMeta.label} />
            )}

            {screen === "reports" && !isGuest && (
              <ReportsScreen reports={REPORTS} roleLabel={roleMeta.label} />
            )}

            {screen === "settings" && (
              <SettingsScreen
                roleLabel={roleMeta.label}
                name={currentUser?.name || "User"}
                email={currentUser?.email || ""}
                isGuest={isGuest}
                detail={settingsDetail}
                onOpenDetail={setSettingsDetail}
                onBack={() => setSettingsDetail(null)}
                onLogout={handleLogout}
                onSignIn={() => handleGuestAuth("welcome")}
                onCreateAccount={() => handleGuestAuth("signup")}
              />
            )}
          </div>

          <BottomNav navItems={navItems} active={screen} onChange={setScreen} />
        </div>
        <AiAssistant
          open={aiOpen}
          onOpen={() => setAiOpen(true)}
          onClose={() => setAiOpen(false)}
          messages={aiMessages}
          typing={aiTyping}
          prompts={AI_PROMPTS}
          onPrompt={handleAiPrompt}
          roleLabel={roleMeta.label}
          screen={screen}
          online={online}
          result={verificationResult}
        />
      </PhoneFrame>
    </div>
  );
}

function AppLoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  showPassword,
  setShowPassword,
  error,
  isLoading,
  onLogin,
  onGuest,
}: any) {
  const roleOptions = Object.entries(ROLE_META) as [
    UserRole,
    (typeof ROLE_META)[UserRole]
  ][];

  return (
    <div className="app-login-screen" style={styles.appLoginScreen}>
      <div className="app-login-top" style={styles.appLoginTop}>
        <div style={styles.secureAccessBadge}>
          <ShieldCheck size={14} color={COLORS.success} />
          <span>Secure compliance access</span>
        </div>

        <div style={styles.appLogoRow}>
          <div className="app-logo-mark" style={styles.appLogoMark}>
            <ShieldCheck size={28} color={COLORS.card} />
          </div>
          <div>
            <div style={styles.appLoginKicker}>
              Enterprise medicine verification
            </div>
            <h1 style={styles.appLoginTitle}>MedAuth</h1>
            <p style={styles.appLoginSubtitle}>
              Premium healthcare SaaS authentication for verified medicine
              workflows, compliance review, and trusted operational access.
            </p>
          </div>
        </div>

        <div style={styles.loginSecurityMessage}>
          <Lock size={14} color={COLORS.primary} />
          <span>
            Secure role-based access for medication verification and compliance monitoring.
          </span>
        </div>

        <div style={styles.enterpriseStatusRow}>
          <div className="enterprise-status-chip" style={styles.enterpriseStatusChip}>
            <ShieldCheck size={14} color={COLORS.success} />
            <span>HIPAA-ready prototype</span>
          </div>
          <div className="enterprise-status-chip" style={styles.enterpriseStatusChip}>
            <Lock size={14} color={COLORS.primary} />
            <span>Secure compliance access</span>
          </div>
        </div>
      </div>

      <div className="app-login-card-wrap">
        <Card style={styles.appLoginCard}>
          <div style={styles.loginCardHeader}>
            <div>
              <div style={styles.cardTitle}>Secure sign in</div>
              <div style={styles.loginCardSubtitle}>
                Choose your role to enter the correct MedAuth workspace.
              </div>
            </div>
            <div style={styles.loginHeaderIcon}>
              <ShieldCheck size={20} color={COLORS.success} />
            </div>
          </div>

          <div style={styles.inputWrap}>
            <div style={styles.inputLabel}>Role-based healthcare authentication</div>
            <div style={styles.roleOptionList}>
              {roleOptions.map(([key, meta], index) => {
                const Icon = meta.icon;
                const selected = role === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className="role-option-motion"
                    onClick={() => setRole(key)}
                    style={{
                      ...styles.roleOptionButton,
                      ...(selected ? styles.roleOptionButtonActive : {}),
                      animationDelay: `${120 + index * 45}ms`,
                    }}
                    aria-pressed={selected}
                  >
                    <div
                      style={{
                        ...styles.roleIconBox,
                        ...(selected ? styles.roleIconBoxActive : {}),
                      }}
                    >
                      <Icon
                        size={17}
                        color={selected ? COLORS.card : COLORS.primary}
                      />
                    </div>
                    <span style={styles.roleTextStack}>
                      <span>{meta.label}</span>
                      <span
                        style={{
                          ...styles.roleAccessText,
                          color: selected ? "rgba(255,255,255,0.78)" : COLORS.subtext,
                        }}
                      >
                        {meta.access}
                      </span>
                    </span>
                    {selected ? (
                      <CheckCircle2
                        className="role-selected-check"
                        size={17}
                        color={COLORS.card}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="Enter work email"
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter password"
            showPassword={showPassword}
            onToggle={() => setShowPassword((v: boolean) => !v)}
          />

          {error ? <div style={styles.errorText}>{error}</div> : null}

          <div className="login-submit-motion">
            <PrimaryButton
              label={isLoading ? "Verifying Access" : "Continue to Dashboard"}
              onClick={onLogin}
              icon={Lock}
              loading={isLoading}
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            className="guest-access-button"
            style={styles.guestAccessButton}
            onClick={onGuest}
            disabled={isLoading}
          >
            <User size={16} color={COLORS.primary} />
            <span>Continue with Guest Access</span>
          </button>
        </Card>
      </div>
    </div>
  );
}

function PhoneFrame({ children }: any) {
  return (
    <div className="phone-frame" style={styles.phoneOuter}>
      <div style={styles.phoneNotch} />
      <div style={styles.phoneInner}>{children}</div>
    </div>
  );
}

function StatusBar({ online }: any) {
  return (
    <div style={styles.statusBar}>
      <span>9:41</span>
      <div style={styles.statusRight}>
        {online ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>100%</span>
      </div>
    </div>
  );
}

function TopBar({ title, onBack }: any) {
  return (
    <div style={styles.topBar}>
      <div style={styles.topBarSide}>
        {onBack ? (
          <IconButton icon={ArrowLeft} onClick={onBack} />
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>
      <div style={styles.topBarTitle}>{title}</div>
      <div style={styles.topBarSide}>
        <div style={{ width: 36 }} />
      </div>
    </div>
  );
}

function WelcomeScreen({ onLogin, onSignup, onGuest }: any) {
  return (
    <div style={styles.authContainer}>
      <div style={styles.brandBlock}>
        <div style={styles.brandIcon}>
          <ShieldCheck size={28} color={COLORS.card} />
        </div>
        <div>
          <h1 style={styles.brandTitle}>WissenMedAuth</h1>
          <p style={styles.brandSubtitle}>
            Medication verification made simple, secure, and accessible
          </p>
        </div>
      </div>

      <div style={styles.heroCard}>
        <div style={styles.heroPhoneMock}>
          <Camera size={26} color={COLORS.primary} />
          <div style={styles.heroText}>
            Scan barcode, verify authenticity, and report suspicious medicines.
          </div>
        </div>
      </div>

      <div style={styles.stackGap}>
        <PrimaryButton label="Log In" onClick={onLogin} />
        <SecondaryButton label="Create Account" onClick={onSignup} />
        <TextButton label="Continue as Guest" onClick={onGuest} />
      </div>
    </div>
  );
}

function AuthScreen({
  title,
  subtitle,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  onBack,
  onPrimary,
  primaryLabel,
  secondaryLabel,
  onSecondary,
  onForgot,
}: any) {
  return (
    <div style={styles.authContainer}>
      <IconButton icon={ArrowLeft} onClick={onBack} />
      <div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionSubtitle}>{subtitle}</p>
      </div>

      <Card>
        <Input
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          showPassword={showPassword}
          onToggle={() => setShowPassword((v: boolean) => !v)}
        />
        {error ? <div style={styles.errorText}>{error}</div> : null}
        <button style={styles.simpleLink} onClick={onForgot}>
          Forgot password?
        </button>
      </Card>

      <div style={styles.stackGap}>
        <PrimaryButton label={primaryLabel} onClick={onPrimary} />
        <TextButton label={secondaryLabel} onClick={onSecondary} />
      </div>
    </div>
  );
}

function SignUpScreen({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  success,
  onBack,
  onCreate,
}: any) {
  return (
    <div style={styles.authContainer}>
      <IconButton icon={ArrowLeft} onClick={onBack} />
      <div>
        <h2 style={styles.sectionTitle}>Create account</h2>
        <p style={styles.sectionSubtitle}>
          Public registration creates a Consumer account only
        </p>
      </div>

      <Card>
        <Input
          label="Full Name"
          value={name}
          onChange={setName}
          placeholder="Enter your full name"
        />
        <Input
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
          showPassword={showPassword}
          onToggle={() => setShowPassword((v: boolean) => !v)}
        />

        <div style={styles.helperText}></div>
        {error ? <div style={styles.errorText}>{error}</div> : null}
        {success ? <div style={styles.successText}>{success}</div> : null}
      </Card>

      <PrimaryButton label="Create Account" onClick={onCreate} />
    </div>
  );
}

function ForgotPasswordScreen({
  forgotEmail,
  setForgotEmail,
  newForgotPassword,
  setNewForgotPassword,
  forgotError,
  forgotMessage,
  showPassword,
  setShowPassword,
  onBack,
  onReset,
}: any) {
  return (
    <div style={styles.authContainer}>
      <IconButton icon={ArrowLeft} onClick={onBack} />
      <div>
        <h2 style={styles.sectionTitle}>Reset password</h2>
        <p style={styles.sectionSubtitle}>
          Enter your registered email address and choose a new password
        </p>
      </div>

      <Card>
        <Input
          label="Registered Email"
          value={forgotEmail}
          onChange={setForgotEmail}
          placeholder="Enter your registered email"
        />
        <PasswordInput
          label="New Password"
          value={newForgotPassword}
          onChange={setNewForgotPassword}
          placeholder="Enter your new password"
          showPassword={showPassword}
          onToggle={() => setShowPassword((v: boolean) => !v)}
        />
        {forgotError ? <div style={styles.errorText}>{forgotError}</div> : null}
        {forgotMessage ? (
          <div style={styles.successText}>{forgotMessage}</div>
        ) : null}
      </Card>

      <PrimaryButton label="Reset Password" onClick={onReset} />
    </div>
  );
}

function HomeScreen({
  roleMeta,
  online,
  onToggleOnline,
  onNavigate,
  isGuest,
  currentRole,
  onGuestBack,
}: any) {
  const RoleIcon = roleMeta.icon;
  const dashboardCards = DASHBOARD_CARDS[currentRole as UserRole] || DASHBOARD_CARDS.consumer;
  const dashboardKpis = [
    {
      label: "Verified",
      value: currentRole === "consumer" ? "3" : "1.2k",
      trend: "+12%",
      tone: "success" as const,
    },
    {
      label: "Alerts",
      value: currentRole === "consumer" ? "0" : "3",
      trend: currentRole === "regulator" ? "1 high" : "stable",
      tone: currentRole === "regulator" ? ("danger" as const) : ("primary" as const),
    },
    {
      label: "Sync",
      value: online ? "Live" : "Cache",
      trend: online ? "online" : "offline",
      tone: online ? ("success" as const) : ("warning" as const),
    },
  ];

  return (
    <div style={styles.stackGapLg}>
      <Card style={styles.dashboardHeroCard}>
        <div style={styles.heroHeader}>
          <div>
            <div style={styles.welcomeText}>MedAuth workspace</div>
            <div style={styles.heroName}>
              WissenMedAuth {isGuest ? "Guest" : roleMeta.label}
            </div>
            <div style={styles.dashboardHeroSubtext}>
              Secure role-based access for medication verification and compliance monitoring.
            </div>
          </div>
          <div style={styles.rolePill}>
            <RoleIcon size={16} color={COLORS.primary} />
            <span>{isGuest ? "Guest" : roleMeta.label}</span>
          </div>
        </div>

        <div style={styles.kpiGrid}>
          {dashboardKpis.map((item) => (
            <div key={item.label} style={styles.kpiCard}>
              <div style={styles.kpiLabel}>{item.label}</div>
              <div style={styles.kpiValue}>{item.value}</div>
              <StatusBadge label={item.trend} tone={item.tone} />
            </div>
          ))}
        </div>

        <div style={styles.connectionCard}>
          <div>
            <div style={styles.connectionTitle}>
              {online ? "Online Verification Active" : "Offline Mode Active"}
            </div>
            <div style={styles.connectionSubtitle}>
              {online
                ? "Real-time medication verification is available."
                : "Limited verification is available until connectivity is restored."}
            </div>
          </div>
          <button onClick={onToggleOnline} style={styles.toggleButton}>
            {online ? (
              <Wifi size={16} color={COLORS.primary} />
            ) : (
              <WifiOff size={16} color={COLORS.warning} />
            )}
          </button>
        </div>
      </Card>

      <div style={styles.dashboardCardGrid}>
        {dashboardCards.map((card, index) => (
          <DashboardActionCard
            key={card.title}
            card={card}
            index={index}
            disabled={
              isGuest && (card.screen === "report" || card.screen === "history")
            }
            onClick={() => {
              if (
                isGuest &&
                (card.screen === "report" || card.screen === "history")
              ) {
                return;
              }
              onNavigate(card.screen);
            }}
          />
        ))}
      </div>

      <Card>
        <div style={styles.cardHeaderRow}>
          <div>
            <div style={styles.cardTitle}>Operational Snapshot</div>
            <div style={styles.snapshotSubtext}>
              Mock prototype data for the selected role dashboard.
            </div>
          </div>
          <StatusBadge label="Prototype" tone="primary" />
        </div>
        <div style={styles.featureList}>
          <div style={styles.featureRow}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <span>Authentication and role routing are simulated on-device.</span>
          </div>
          <div style={styles.featureRow}>
            <ShieldCheck size={16} color={COLORS.primary} />
            <span>Verification, alerts, reports, and sync states use mock records.</span>
          </div>
          <div style={styles.featureRow}>
            <Lock size={16} color={COLORS.success} />
            <span>Designed for medication verification and compliance workflows.</span>
          </div>
        </div>
      </Card>

      {isGuest && (
        <SecondaryButton label="Back" onClick={onGuestBack} icon={ArrowLeft} />
      )}
    </div>
  );
}

function DashboardActionCard({ card, index, disabled, onClick }: any) {
  const Icon = card.icon;
  const toneStyle = getToneStyle(card.tone);

  return (
    <button
      type="button"
      className="dashboard-action-card"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.dashboardActionCard,
        animationDelay: `${index * 55}ms`,
        opacity: disabled ? 0.62 : 1,
      }}
    >
      <div style={styles.dashboardActionTop}>
        <div
          style={{
            ...styles.dashboardIconWrap,
            background: toneStyle.bg,
          }}
        >
          <Icon size={18} color={toneStyle.color} />
        </div>
        <StatusBadge label={card.badge} tone={card.tone} />
      </div>
      <div style={styles.dashboardMetric}>{card.metric}</div>
      <div style={styles.dashboardCardTitle}>{card.title}</div>
      <div style={styles.dashboardCardDescription}>{card.description}</div>
    </button>
  );
}

function getToneStyle(tone: DashboardCard["tone"]) {
  if (tone === "success") return { color: COLORS.success, bg: "#EAF8F0" };
  if (tone === "warning") return { color: COLORS.warning, bg: "#FFF7E8" };
  if (tone === "danger") return { color: COLORS.danger, bg: "#FDECEC" };
  if (tone === "neutral") return { color: COLORS.subtext, bg: "#F3F4F6" };
  return { color: COLORS.primary, bg: "#EEF5FF" };
}

function StatusBadge({ label, tone }: any) {
  const toneStyle = getToneStyle(tone || "primary");
  return (
    <span
      style={{
        ...styles.statusBadge,
        background: toneStyle.bg,
        color: toneStyle.color,
      }}
    >
      {label}
    </span>
  );
}

function ScanScreen({ scanInput, setScanInput, onVerify, online }: any) {
  return (
    <div style={styles.stackGapLg}>
      <Card>
        <div style={styles.scannerArea}>
          <Camera size={28} color={COLORS.primary} />
          <div style={styles.scannerTitle}>Medication Scan</div>
          <div style={styles.scannerSubtitle}>
            {online
              ? "Align the barcode within the frame or enter the code below."
              : "You are offline. Verification will use cached data only."}
          </div>
        </div>
      </Card>

      <Card>
        <Input
          label="Barcode or Manual Code"
          value={scanInput}
          onChange={setScanInput}
          placeholder='Type normal text for Authentic, "warn" for Suspicious, or "fake" for Counterfeit'
          icon={Search}
        />
      </Card>

      <PrimaryButton label="Verify Medication" onClick={onVerify} />
    </div>
  );
}

function ResultScreen({ result, role, isGuest, onReport }: any) {
  const config = getStatusConfig(result.status);
  const Icon = config.icon;

  return (
    <div style={styles.stackGapLg}>
      <Card style={{ background: config.bg, borderColor: config.color }}>
        <div style={styles.resultHeader}>
          <div style={{ ...styles.resultIconWrap, background: config.color }}>
            <Icon size={22} color={COLORS.card} />
          </div>
          <div>
            <div style={styles.resultStatus}>{result.status}</div>
            <div style={styles.resultNote}>{config.note}</div>
          </div>
        </div>
      </Card>

      <Card>
        <InfoRow label="Medication" value={result.medicine} />
        <InfoRow label="Batch" value={result.batch} />
        <InfoRow label="Manufacturer" value={result.manufacturer} />
        <InfoRow label="Expiry Date" value={result.expiry} />
        <InfoRow label="Confidence Score" value={result.confidence} />
        {(role === "pharmacist" || role === "healthcare") && (
          <>
            <InfoRow
              label="Clinical Guidance"
              value="Verify dosage, storage, and patient suitability before use."
            />
            <InfoRow
              label="Handling Advice"
              value="Retain packaging and escalate anomalies immediately."
            />
          </>
        )}
      </Card>

      {!isGuest && <SecondaryButton label="Report Issue" onClick={onReport} />}
    </div>
  );
}

function ReportScreen({
  reportText,
  setReportText,
  onSubmit,
  reportSubmitted,
}: any) {
  return (
    <div style={styles.stackGapLg}>
      <Card>
        <div style={styles.cardTitle}>Report Suspicious Medicine</div>
        <TextArea
          label="Report Details"
          value={reportText}
          onChange={setReportText}
          placeholder="Describe the issue, batch concerns, packaging differences, or other observations."
        />
        <button style={styles.uploadBox}>
          <Upload size={18} color={COLORS.primary} />
          <span>Upload supporting image or evidence</span>
        </button>
      </Card>
      <PrimaryButton
        label={reportSubmitted ? "Report Submitted" : "Submit Report"}
        onClick={onSubmit}
        disabled={reportSubmitted}
      />
    </div>
  );
}

function OfflineScreen({ onSync }: any) {
  return (
    <div style={styles.stackGapLg}>
      <Card>
        <div style={styles.offlineBanner}>
          <WifiOff size={22} color={COLORS.warning} />
          <div>
            <div style={styles.cardTitle}>Offline Verification</div>
            <div style={styles.sectionSubtitle}>
              The system is using cached verification data. Results may be
              limited until synchronization is completed.
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <InfoRow label="Cached Data Status" value="Available" />
        <InfoRow label="Pending Synchronization" value="12 records" />
        <InfoRow label="Last Successful Sync" value="2026-04-21 18:40" />
      </Card>
      <PrimaryButton label="Sync When Online" onClick={onSync} />
    </div>
  );
}

function HistoryScreen({ history }: any) {
  return (
    <div style={styles.stackGapLg}>
      {history.map((item: HistoryItem) => {
        const cfg = getStatusConfig(item.status);
        return (
          <Card key={item.id}>
            <div style={styles.historyTop}>
              <div>
                <div style={styles.historyMedicine}>{item.medicine}</div>
                <div style={styles.historyMeta}>
                  {item.batch} • {item.date}
                </div>
              </div>
              <span
                style={{
                  ...styles.statusBadge,
                  background: cfg.bg,
                  color: cfg.color,
                }}
              >
                {item.status}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AlertsScreen({ alerts, roleLabel }: any) {
  return (
    <div style={styles.stackGapLg}>
      <Card>
        <div style={styles.cardTitle}>{roleLabel} Alerts</div>
        <div style={styles.featureList}>
          {alerts.map((alert: AlertItem) => (
            <div key={alert.id} style={styles.alertRow}>
              <TriangleAlert
                size={18}
                color={
                  alert.severity === "High"
                    ? COLORS.danger
                    : alert.severity === "Medium"
                    ? COLORS.warning
                    : COLORS.primary
                }
              />
              <div>
                <div style={styles.alertMessage}>{alert.message}</div>
                <div style={styles.alertMeta}>
                  {alert.id} • {alert.severity} Priority
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ReportsScreen({ reports, roleLabel }: any) {
  return (
    <div style={styles.stackGapLg}>
      <Card>
        <div style={styles.cardTitle}>{roleLabel} Reports</div>
        {reports.map((report: ReportItem) => (
          <div key={report.id} style={styles.reportRow}>
            <FileText size={18} color={COLORS.primary} />
            <div>
              <div style={styles.alertMessage}>{report.title}</div>
              <div style={styles.alertMeta}>
                {report.id} • {report.date}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SettingsScreen({
  roleLabel,
  name,
  email,
  isGuest,
  detail,
  onOpenDetail,
  onBack,
  onLogout,
  onSignIn,
  onCreateAccount,
}: any) {
  if (detail === "privacy") return <PrivacySecurityScreen />;
  if (detail === "language") return <LanguagePreferencesScreen />;
  if (detail === "verification") return <VerificationPreferencesScreen />;
  if (detail === "guest") {
    return (
      <GuestAccessScreen
        isGuest={isGuest}
        onSignIn={onSignIn}
        onCreateAccount={onCreateAccount}
      />
    );
  }

  return (
    <div className="settings-page-motion" style={styles.stackGapLg}>
      <Card>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {(name?.charAt(0) || "U").toUpperCase()}
          </div>
          <div>
            <div style={styles.historyMedicine}>{name}</div>
            {email ? <div style={styles.historyMeta}>{email}</div> : null}
            <div style={styles.historyMeta}>
              {isGuest ? "Guest Access" : roleLabel}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SettingRow
          icon={Lock}
          label="Privacy and Security"
          description="Permissions, privacy notice, and account protection"
          onClick={() => onOpenDetail("privacy")}
        />
        <SettingRow
          icon={Globe}
          label="Language Preferences"
          description="Language, locale, and date display choices"
          onClick={() => onOpenDetail("language")}
        />
        <SettingRow
          icon={ShieldCheck}
          label="Verification Preferences"
          description="Scan feedback, result detail, and history behavior"
          onClick={() => onOpenDetail("verification")}
        />
        <SettingRow
          icon={User}
          label="Guest Access"
          description="See what works before account registration"
          onClick={() => onOpenDetail("guest")}
        />
      </Card>

      <SecondaryButton
        label={isGuest ? "Exit Guest Session" : "Log Out"}
        onClick={onLogout}
        icon={LogOut}
      />
    </div>
  );
}

function PrivacySecurityScreen() {
  const [camera, setCamera] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState("While Using App");
  const [storage, setStorage] = useState("Encrypted on device");
  const [sessionSecurity, setSessionSecurity] = useState(true);
  const [biometric, setBiometric] = useState(false);

  return (
    <SettingsDetailShell
      title="Privacy and Security"
      subtitle="Control device permissions, session protection, and how MedAuth handles verification data."
    >
      <Card>
        <ToggleRow
          icon={Camera}
          label="Camera Permission"
          description="Allow barcode and package image scanning from the secure verification flow."
          checked={camera}
          onChange={setCamera}
        />
        <ToggleRow
          icon={Bell}
          label="Notification Permission"
          description="Receive product warnings, sync reminders, and account security updates."
          checked={notifications}
          onChange={setNotifications}
        />
        <SelectRow
          icon={MapPin}
          label="Location Access"
          description="Attach a region to suspicious product reports when allowed."
          value={location}
          onChange={setLocation}
          options={["Never", "While Using App", "Ask Every Time"]}
        />
      </Card>

      <Card>
        <SelectRow
          icon={Database}
          label="Data Storage"
          description="Choose how verification history is retained on this device."
          value={storage}
          onChange={setStorage}
          options={["Encrypted on device", "Cloud sync enabled", "Do not store history"]}
        />
        <ToggleRow
          icon={Lock}
          label="Session Security"
          description="Require a fresh security check after inactivity."
          checked={sessionSecurity}
          onChange={setSessionSecurity}
        />
        <ToggleRow
          icon={Fingerprint}
          label="Biometric Login"
          description="Use Face ID, Touch ID, or supported device biometrics for faster sign in."
          checked={biometric}
          onChange={setBiometric}
        />
      </Card>

      <Card style={styles.noticeCard}>
        <div style={styles.detailCardTitle}>Privacy Notice</div>
        <div style={styles.detailDescription}>
          MedAuth uses permission access only to support medicine verification,
          safety alerts, account security, and compliance-ready activity records.
        </div>
      </Card>
    </SettingsDetailShell>
  );
}

function LanguagePreferencesScreen() {
  const [appLanguage, setAppLanguage] = useState("English");
  const [resultLanguage, setResultLanguage] = useState("Match app language");
  const [terminology, setTerminology] = useState("Consumer-friendly");
  const [locale, setLocale] = useState("United States");
  const [dateFormat, setDateFormat] = useState("Apr 26, 2026 • 9:41 AM");
  const [saved, setSaved] = useState(false);

  const savePreference = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  return (
    <SettingsDetailShell
      title="Language Preferences"
      subtitle="Personalize language, regional formatting, and medical wording across MedAuth."
    >
      <Card>
        <SelectRow
          icon={Languages}
          label="App Language"
          description="Set the language used for navigation and account screens."
          value={appLanguage}
          onChange={setAppLanguage}
          options={["English", "Filipino", "Spanish", "French"]}
        />
        <SelectRow
          icon={Globe}
          label="Result Language"
          description="Choose how verification results and safety guidance are shown."
          value={resultLanguage}
          onChange={setResultLanguage}
          options={["Match app language", "English", "Local language"]}
        />
        <SelectRow
          icon={Stethoscope}
          label="Medical Terminology Style"
          description="Adjust terminology for everyday use or professional workflows."
          value={terminology}
          onChange={setTerminology}
          options={["Consumer-friendly", "Clinical", "Pharmacy operations"]}
        />
      </Card>

      <Card>
        <SelectRow
          icon={MapPin}
          label="Region / Locale"
          description="Set regional defaults for alerts, compliance records, and display labels."
          value={locale}
          onChange={setLocale}
          options={["United States", "Philippines", "European Union", "United Kingdom"]}
        />
        <SelectRow
          icon={History}
          label="Date and Time Format"
          description="Choose how timestamps appear in results, history, and reports."
          value={dateFormat}
          onChange={setDateFormat}
          options={["Apr 26, 2026 • 9:41 AM", "26 Apr 2026 • 09:41", "2026-04-26 • 09:41"]}
        />
      </Card>

      <PrimaryButton
        label={saved ? "Preference Saved" : "Save Preference"}
        onClick={savePreference}
        icon={Save}
      />
    </SettingsDetailShell>
  );
}

function VerificationPreferencesScreen() {
  const [mode, setMode] = useState("Scan barcode first");
  const [detailedResult, setDetailedResult] = useState(true);
  const [blockchainStatus, setBlockchainStatus] = useState(true);
  const [scanSound, setScanSound] = useState(false);
  const [vibration, setVibration] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [warningSensitivity, setWarningSensitivity] = useState("Balanced");
  const [offlineReminder, setOfflineReminder] = useState(true);

  return (
    <SettingsDetailShell
      title="Verification Preferences"
      subtitle="Tune the way scans, verification results, alerts, and offline reminders behave."
    >
      <Card>
        <SelectRow
          icon={SlidersHorizontal}
          label="Default Verification Mode"
          description="Choose the first method shown when opening medication verification."
          value={mode}
          onChange={setMode}
          options={["Scan barcode first", "Manual code entry", "Package photo review"]}
        />
        <ToggleRow
          icon={FileText}
          label="Show Detailed Result"
          description="Display manufacturer, batch, expiry, and confidence details after each scan."
          checked={detailedResult}
          onChange={setDetailedResult}
        />
        <ToggleRow
          icon={ShieldCheck}
          label="Show Blockchain Status"
          description="Show chain-of-custody status when records are available."
          checked={blockchainStatus}
          onChange={setBlockchainStatus}
        />
      </Card>

      <Card>
        <ToggleRow
          icon={Volume2}
          label="Enable Scan Sound"
          description="Play a soft confirmation tone after a successful scan."
          checked={scanSound}
          onChange={setScanSound}
        />
        <ToggleRow
          icon={Wifi}
          label="Enable Vibration Feedback"
          description="Use haptics for verified, warning, and blocked scan outcomes."
          checked={vibration}
          onChange={setVibration}
        />
        <ToggleRow
          icon={History}
          label="Auto Save Verification History"
          description="Keep a secure local record of completed verification activity."
          checked={autoSave}
          onChange={setAutoSave}
        />
      </Card>

      <Card>
        <SelectRow
          icon={TriangleAlert}
          label="Warning Sensitivity"
          description="Control how quickly MedAuth raises caution messages."
          value={warningSensitivity}
          onChange={setWarningSensitivity}
          options={["Standard", "Balanced", "High sensitivity"]}
        />
        <ToggleRow
          icon={WifiOff}
          label="Offline Result Reminder"
          description="Remind users when a result was generated from cached data."
          checked={offlineReminder}
          onChange={setOfflineReminder}
        />
      </Card>
    </SettingsDetailShell>
  );
}

function GuestAccessScreen({ isGuest, onSignIn, onCreateAccount }: any) {
  return (
    <SettingsDetailShell
      title="Guest Access"
      subtitle="Preview the medication verification experience and unlock more tools with a registered account."
    >
      <Card style={styles.guestAccessSummaryCard}>
        <div style={styles.detailCardTitle}>Current Access Level</div>
        <div style={styles.guestAccessLevel}>
          {isGuest ? "Guest verification" : "Registered account"}
        </div>
        <div style={styles.detailDescription}>
          {isGuest
            ? "Guest mode keeps access lightweight for quick medication scans."
            : "Your account includes saved activity, reporting, alerts, and role-based workspace tools."}
        </div>
      </Card>

      <Card>
        <div style={styles.detailCardTitle}>Available in Guest Mode</div>
        <CapabilityRow label="Medication barcode scanning" available />
        <CapabilityRow label="Basic authenticity result" available />
        <CapabilityRow label="Offline result notice" available />
        <CapabilityRow label="Core privacy and language settings" available />
      </Card>

      <Card>
        <div style={styles.detailCardTitle}>Unavailable in Guest Mode</div>
        <CapabilityRow label="Saved verification history" />
        <CapabilityRow label="Incident reports and evidence uploads" />
        <CapabilityRow label="Role-based alerts and compliance reports" />
        <CapabilityRow label="Cloud sync across authorized devices" />
      </Card>

      <Card style={styles.noticeCard}>
        <div style={styles.detailCardTitle}>Why Register</div>
        <div style={styles.detailDescription}>
          Registration protects safety records, unlocks reporting tools, and
          connects verification activity to the right healthcare role.
        </div>
      </Card>

      <div style={styles.settingsActionGrid}>
        <SecondaryButton label="Sign In" onClick={onSignIn} icon={Lock} />
        <PrimaryButton label="Create Account" onClick={onCreateAccount} icon={User} />
      </div>
    </SettingsDetailShell>
  );
}

function SettingsDetailShell({ title, subtitle, children }: any) {
  return (
    <div className="settings-page-motion" style={styles.stackGapLg}>
      <Card style={styles.settingsHeroCard}>
        <div style={styles.detailKicker}>MedAuth settings</div>
        <h2 style={styles.detailTitle}>{title}</h2>
        <p style={styles.detailSubtitle}>{subtitle}</p>
      </Card>
      {children}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: any) {
  return (
    <div style={styles.preferenceRow}>
      <div style={styles.preferenceLeft}>
        <div style={styles.preferenceIcon}>
          <Icon size={16} color={COLORS.primary} />
        </div>
        <div>
          <div style={styles.preferenceLabel}>{label}</div>
          <div style={styles.preferenceDescription}>{description}</div>
        </div>
      </div>
      <button
        type="button"
        aria-label={label}
        aria-pressed={checked}
        className="setting-toggle"
        onClick={() => onChange(!checked)}
        style={{
          ...styles.switchTrack,
          background: checked ? COLORS.primary : "#CBD5E1",
        }}
      >
        <span
          style={{
            ...styles.switchThumb,
            transform: checked ? "translateX(18px)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}

function SelectRow({ icon: Icon, label, description, value, onChange, options }: any) {
  return (
    <div style={styles.preferenceRow}>
      <div style={styles.preferenceLeft}>
        <div style={styles.preferenceIcon}>
          <Icon size={16} color={COLORS.primary} />
        </div>
        <div>
          <div style={styles.preferenceLabel}>{label}</div>
          <div style={styles.preferenceDescription}>{description}</div>
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            style={styles.settingsSelect}
          >
            {options.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function CapabilityRow({ label, available = false }: any) {
  return (
    <div style={styles.capabilityRow}>
      {available ? (
        <CheckCircle2 size={16} color={COLORS.success} />
      ) : (
        <X size={16} color={COLORS.danger} />
      )}
      <span>{label}</span>
    </div>
  );
}

function AiAssistant({
  open,
  onOpen,
  onClose,
  messages,
  typing,
  prompts,
  onPrompt,
  roleLabel,
  screen,
  online,
  result,
}: any) {
  const statusCfg = getStatusConfig(result.status);

  return (
    <div style={styles.aiLayer}>
      {open && (
        <div className="ai-panel-motion" style={styles.aiPanel}>
          <div style={styles.aiPanelGlow} />
          <div style={styles.aiHeader}>
            <div style={styles.aiTitleRow}>
              <div className="ai-orb-motion" style={styles.aiIconWrap}>
                <Bot size={20} color={COLORS.card} />
              </div>
              <div>
                <div style={styles.aiTitle}>MedAuth AI Assistant</div>
                <div style={styles.aiSubtitle}>Prototype AI assistance</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close AI Assistant"
              onClick={onClose}
              style={styles.aiCloseButton}
            >
              <X size={16} color={COLORS.text} />
            </button>
          </div>

          <div style={styles.aiContextGrid}>
            <div style={styles.aiContextChip}>
              <User size={13} color={COLORS.primary} />
              <span>{roleLabel}</span>
            </div>
            <div style={styles.aiContextChip}>
              {online ? (
                <Wifi size={13} color={COLORS.success} />
              ) : (
                <WifiOff size={13} color={COLORS.warning} />
              )}
              <span>{online ? "Live sync" : "Offline cache"}</span>
            </div>
            <div style={styles.aiContextChip}>
              <ClipboardCheck size={13} color={statusCfg.color} />
              <span>{result.status}</span>
            </div>
            <div style={styles.aiContextChip}>
              <Sparkles size={13} color={COLORS.success} />
              <span>{screen}</span>
            </div>
          </div>

          <div style={styles.aiPrototypeNotice}>{AI_PROTOTYPE_LABEL}</div>

          <div style={styles.aiMessages}>
            {messages.map((message: ChatMessage) => (
              <div
                key={message.id}
                className="ai-message-motion"
                style={{
                  ...styles.aiMessageRow,
                  justifyContent:
                    message.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.aiMessageBubble,
                    ...(message.sender === "user"
                      ? styles.aiUserBubble
                      : styles.aiAssistantBubble),
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="ai-message-motion" style={styles.aiMessageRow}>
                <div style={{ ...styles.aiMessageBubble, ...styles.aiAssistantBubble }}>
                  <div style={styles.typingRow}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={styles.aiPromptGrid}>
            {prompts.map((prompt: string) => (
              <button
                key={prompt}
                type="button"
                className="ai-prompt-button"
                onClick={() => onPrompt(prompt)}
                disabled={typing}
                style={styles.aiPromptButton}
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ai-send-button"
            onClick={() => onPrompt("Explain this verification result")}
            disabled={typing}
            style={styles.aiSendButton}
          >
            <Send size={15} color={COLORS.card} />
            <span>Ask for next action</span>
          </button>
        </div>
      )}

      {!open && (
        <button
          type="button"
          className="ai-floating-button"
          onClick={onOpen}
          style={styles.aiFloatingButton}
          aria-label="Open MedAuth AI Assistant"
        >
          <Bot size={22} color={COLORS.card} />
          <span style={styles.aiFloatingText}>AI</span>
        </button>
      )}
    </div>
  );
}

function BottomNav({ navItems, active, onChange }: any) {
  return (
    <div
      style={{
        ...styles.bottomNav,
        gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
      }}
    >
      {navItems.map((key: keyof typeof NAV_META) => {
        const item = NAV_META[key];
        const Icon = item.icon;
        const selected = key === active;
        return (
          <button key={key} onClick={() => onChange(key)} style={styles.navBtn}>
            <Icon
              size={18}
              color={selected ? COLORS.primary : COLORS.subtext}
            />
            <span
              style={{
                ...styles.navLabel,
                color: selected ? COLORS.primary : COLORS.subtext,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} style={styles.quickAction}>
      <div style={styles.quickIcon}>
        <Icon size={18} color={COLORS.primary} />
      </div>
      <span style={styles.quickLabel}>{label}</span>
    </button>
  );
}

function Card({ children, style = {} }: any) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

function IconButton({ icon: Icon, onClick }: any) {
  return (
    <button onClick={onClick} style={styles.iconButton}>
      <Icon size={18} color={COLORS.text} />
    </button>
  );
}

function PrimaryButton({
  label,
  onClick,
  disabled = false,
  icon: Icon,
  loading = false,
}: any) {
  return (
    <button
      className="primary-button-motion"
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles.primaryBtn, opacity: disabled ? 0.7 : 1 }}
    >
      {loading ? (
        <span className="login-spinner" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={16} color={COLORS.card} />
      ) : null}
      <span>{label}</span>
    </button>
  );
}

function SecondaryButton({ label, onClick, icon: Icon }: any) {
  return (
    <button className="secondary-button-motion" onClick={onClick} style={styles.secondaryBtn}>
      {Icon ? <Icon size={16} color={COLORS.primary} /> : null}
      <span>{label}</span>
    </button>
  );
}

function TextButton({ label, onClick }: any) {
  return (
    <button onClick={onClick} style={styles.textBtn}>
      {label}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  readOnly = false,
}: any) {
  return (
    <div style={styles.inputWrap}>
      <div style={styles.inputLabel}>{label}</div>
      <div className="input-box-motion" style={styles.inputBox}>
        {Icon ? <Icon size={16} color={COLORS.subtext} /> : null}
        <input
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggle,
}: any) {
  return (
    <div style={styles.inputWrap}>
      <div style={styles.inputLabel}>{label}</div>
      <div className="input-box-motion" style={styles.inputBox}>
        <Lock size={16} color={COLORS.subtext} />
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
        />
        <button type="button" onClick={onToggle} style={styles.eyeBtn}>
          {showPassword ? (
            <EyeOff size={16} color={COLORS.subtext} />
          ) : (
            <Eye size={16} color={COLORS.subtext} />
          )}
        </button>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }: any) {
  return (
    <div style={styles.inputWrap}>
      <div style={styles.inputLabel}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.textArea}
        rows={5}
      />
    </div>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, description, onClick }: any) {
  return (
    <button type="button" className="setting-row-button" onClick={onClick} style={styles.settingRow}>
      <div style={styles.settingLeft}>
        <div style={styles.settingIconBox}>
          <Icon size={16} color={COLORS.primary} />
        </div>
        <span style={styles.settingTextStack}>
          <span>{label}</span>
          <span style={styles.settingDescription}>{description}</span>
        </span>
      </div>
      <ArrowLeft
        size={14}
        color={COLORS.subtext}
        style={{ transform: "rotate(180deg)" }}
      />
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  appShell: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #E9F7F8 0%, #EEF5FF 48%, #F7FAFC 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: COLORS.text,
  },
  phoneOuter: {
    width: 390,
    height: 844,
    borderRadius: 42,
    background: "#111827",
    padding: 10,
    boxShadow: "0 30px 60px rgba(15, 23, 42, 0.24)",
    position: "relative",
  },
  phoneInner: {
    width: "100%",
    height: "100%",
    background: COLORS.bg,
    borderRadius: 32,
    overflow: "hidden",
    position: "relative",
  },
  phoneNotch: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    width: 150,
    height: 28,
    background: "#111827",
    borderRadius: 18,
    zIndex: 3,
  },
  statusBar: {
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 20px 0 20px",
    fontSize: 12,
    fontWeight: 600,
    background: COLORS.bg,
  },
  statusRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  screenWrap: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100% - 40px)",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px 12px 16px",
  },
  topBarSide: {
    width: 40,
    display: "flex",
    justifyContent: "center",
  },
  topBarTitle: {
    fontWeight: 700,
    fontSize: 16,
  },
  contentArea: {
    flex: 1,
    overflowY: "auto",
    padding: "0 16px 12px 16px",
  },
  appLoginScreen: {
    height: "calc(100% - 40px)",
    overflowY: "auto",
    padding: "24px 18px 18px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    background: "linear-gradient(160deg, #F7FCFF 0%, #EFF9F6 48%, #ECF4FF 100%)",
  },
  appLoginTop: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  secureAccessBadge: {
    alignSelf: "flex-start",
    minHeight: 32,
    borderRadius: 999,
    border: "1px solid rgba(39, 174, 96, 0.2)",
    background: "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(16px)",
    color: COLORS.text,
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "0 11px",
    fontSize: 11,
    fontWeight: 900,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.05)",
  },
  appLogoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  appLogoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 14px 26px rgba(47, 128, 237, 0.24)",
    flexShrink: 0,
  },
  appLoginKicker: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  appLoginTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1,
    fontWeight: 900,
    color: COLORS.text,
  },
  appLoginSubtitle: {
    margin: "6px 0 0 0",
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 1.4,
  },
  loginSecurityMessage: {
    borderRadius: 8,
    border: "1px solid rgba(47, 128, 237, 0.14)",
    background: "rgba(255,255,255,0.76)",
    color: COLORS.text,
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 11px",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.35,
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },
  enterpriseStatusRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  enterpriseStatusChip: {
    minHeight: 40,
    borderRadius: 14,
    border: "1px solid rgba(47, 128, 237, 0.12)",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(16px)",
    color: COLORS.text,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 10px",
    fontSize: 11,
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },
  appLoginCard: {
    borderRadius: 20,
    border: "1px solid rgba(214, 224, 230, 0.72)",
    background: "rgba(255, 255, 255, 0.78)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 22px 46px rgba(15, 23, 42, 0.12)",
  },
  loginCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  loginCardSubtitle: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: 600,
    marginTop: -6,
    lineHeight: 1.4,
  },
  loginHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: "#EAF8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roleOptionList: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
  },
  roleOptionButton: {
    minHeight: 58,
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: "#FBFCFD",
    color: COLORS.text,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
  },
  roleOptionButtonActive: {
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success})`,
    borderColor: COLORS.primary,
    color: COLORS.card,
    boxShadow: "0 14px 24px rgba(47, 128, 237, 0.25)",
  },
  roleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "#EEF5FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roleIconBoxActive: {
    background: "rgba(255,255,255,0.18)",
  },
  roleTextStack: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  roleAccessText: {
    fontSize: 11,
    lineHeight: 1.25,
    fontWeight: 700,
  },
  guestAccessButton: {
    width: "100%",
    minHeight: 48,
    marginTop: 12,
    borderRadius: 16,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  authContainer: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    height: "calc(100% - 40px)",
  },
  brandBlock: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    paddingTop: 12,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    background: COLORS.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
  },
  brandSubtitle: {
    margin: "6px 0 0 0",
    color: COLORS.subtext,
    lineHeight: 1.5,
    fontSize: 14,
  },
  heroCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 24,
    padding: 16,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  },
  heroPhoneMock: {
    borderRadius: 20,
    background: "linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 100%)",
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    gap: 12,
    padding: 18,
  },
  heroText: {
    color: COLORS.text,
    lineHeight: 1.5,
    fontSize: 15,
    fontWeight: 500,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
  },
  sectionSubtitle: {
    margin: "6px 0 0 0",
    color: COLORS.subtext,
    lineHeight: 1.5,
    fontSize: 14,
  },
  card: {
    background: COLORS.card,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    padding: 16,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  inputWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.text,
  },
  inputBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    background: "#FBFCFD",
    padding: "0 14px",
    minHeight: 50,
  },
  input: {
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    width: "100%",
    resize: "none",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    background: "#FBFCFD",
    padding: 14,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  eyeBtn: {
    background: "transparent",
    border: "none",
    padding: 0,
    display: "flex",
    cursor: "pointer",
  },
  primaryBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 18,
    border: "none",
    background: COLORS.primary,
    color: COLORS.card,
    fontWeight: 700,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 12px 22px rgba(47, 128, 237, 0.28)",
  },
  secondaryBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 18,
    border: `1px solid ${COLORS.primary}`,
    background: "#EEF5FF",
    color: COLORS.primary,
    fontWeight: 700,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  },
  textBtn: {
    border: "none",
    background: "transparent",
    color: COLORS.primary,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  simpleLink: {
    border: "none",
    background: "transparent",
    color: COLORS.primary,
    fontSize: 13,
    padding: 0,
    cursor: "pointer",
    fontWeight: 600,
  },
  stackGap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  stackGapLg: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  heroHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  dashboardHeroCard: {
    borderRadius: 8,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,252,255,0.98))",
  },
  welcomeText: {
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: 600,
  },
  heroName: {
    fontSize: 22,
    fontWeight: 800,
    marginTop: 4,
  },
  dashboardHeroSubtext: {
    color: COLORS.subtext,
    fontSize: 12,
    lineHeight: 1.45,
    marginTop: 8,
    maxWidth: 230,
  },
  rolePill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    background: "#EEF5FF",
    borderRadius: 999,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 700,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginTop: 16,
  },
  kpiCard: {
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    padding: 10,
    minHeight: 88,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 6,
  },
  kpiLabel: {
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: 800,
  },
  kpiValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.1,
  },
  connectionCard: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: "#F9FAFB",
    borderRadius: 18,
    padding: 14,
  },
  connectionTitle: {
    fontWeight: 700,
    marginBottom: 4,
  },
  connectionSubtitle: {
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 1.4,
  },
  toggleButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  dashboardCardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  dashboardActionCard: {
    minHeight: 178,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.text,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 8,
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05)",
  },
  dashboardActionTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  dashboardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dashboardMetric: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.05,
    marginTop: 2,
  },
  dashboardCardTitle: {
    fontSize: 13,
    fontWeight: 900,
    lineHeight: 1.25,
  },
  dashboardCardDescription: {
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: 650,
    lineHeight: 1.42,
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  quickAction: {
    minHeight: 98,
    borderRadius: 22,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: "#EEF5FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontWeight: 700,
    fontSize: 13,
  },
  cardTitle: {
    fontWeight: 800,
    fontSize: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  snapshotSubtext: {
    color: COLORS.subtext,
    fontSize: 12,
    lineHeight: 1.35,
    marginTop: -6,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
  },
  scannerArea: {
    minHeight: 200,
    borderRadius: 18,
    border: `1px dashed ${COLORS.primary}`,
    background: "#F8FBFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textAlign: "center",
    padding: 16,
  },
  scannerTitle: {
    fontWeight: 800,
    fontSize: 18,
  },
  scannerSubtitle: {
    color: COLORS.subtext,
    lineHeight: 1.5,
    fontSize: 14,
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  resultIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultStatus: {
    fontWeight: 800,
    fontSize: 18,
  },
  resultNote: {
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 1.5,
    marginTop: 4,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 0",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  infoLabel: {
    color: COLORS.subtext,
    fontSize: 13,
    minWidth: 110,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "right",
    lineHeight: 1.4,
  },
  uploadBox: {
    width: "100%",
    minHeight: 52,
    borderRadius: 18,
    border: `1px dashed ${COLORS.primary}`,
    background: "#F8FBFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: COLORS.primary,
    fontWeight: 700,
    cursor: "pointer",
  },
  offlineBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  historyMedicine: {
    fontWeight: 800,
    fontSize: 15,
  },
  historyMeta: {
    color: COLORS.subtext,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 1.4,
  },
  statusBadge: {
    borderRadius: 999,
    padding: "6px 8px",
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  alertRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "10px 0",
  },
  alertMessage: {
    fontWeight: 700,
    fontSize: 14,
  },
  alertMeta: {
    color: COLORS.subtext,
    fontSize: 12,
    marginTop: 4,
  },
  reportRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    background: COLORS.primary,
    color: COLORS.card,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 20,
  },
  settingRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 0",
    borderBottom: `1px solid ${COLORS.border}`,
    background: "transparent",
    color: COLORS.text,
    cursor: "pointer",
    textAlign: "left",
  },
  settingLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    fontWeight: 600,
    minWidth: 0,
    flex: 1,
  },
  settingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "#EEF5FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingTextStack: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
    fontSize: 14,
    fontWeight: 800,
  },
  settingDescription: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: 650,
    lineHeight: 1.35,
  },
  settingsHeroCard: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,249,246,0.96))",
    borderColor: "rgba(47, 128, 237, 0.12)",
  },
  detailKicker: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  detailTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.15,
  },
  detailSubtitle: {
    margin: "8px 0 0 0",
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 1.45,
    fontWeight: 600,
  },
  detailCardTitle: {
    fontWeight: 900,
    fontSize: 15,
    marginBottom: 8,
  },
  detailDescription: {
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 1.55,
    fontWeight: 600,
  },
  preferenceRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 0",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  preferenceLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  preferenceIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "#EEF5FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1.25,
  },
  preferenceDescription: {
    color: COLORS.subtext,
    fontSize: 12,
    lineHeight: 1.4,
    fontWeight: 650,
    marginTop: 4,
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 999,
    border: "none",
    padding: 3,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    background: COLORS.card,
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.18)",
    transition: "transform 180ms ease",
  },
  settingsSelect: {
    width: "100%",
    minHeight: 42,
    marginTop: 10,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: "#FBFCFD",
    color: COLORS.text,
    padding: "0 10px",
    fontSize: 13,
    fontWeight: 750,
    outline: "none",
  },
  noticeCard: {
    background: "#F8FBFF",
    borderColor: "rgba(47, 128, 237, 0.16)",
  },
  guestAccessSummaryCard: {
    background:
      "linear-gradient(135deg, rgba(238,245,255,0.96), rgba(234,248,240,0.94))",
    borderColor: "rgba(39, 174, 96, 0.18)",
  },
  guestAccessLevel: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 6,
  },
  capabilityRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 0",
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 750,
    lineHeight: 1.35,
  },
  settingsActionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },
  bottomNav: {
    minHeight: 82,
    background: "rgba(255,255,255,0.92)",
    borderTop: `1px solid ${COLORS.border}`,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    padding: "10px 8px 20px 8px",
    backdropFilter: "blur(14px)",
  },
  navBtn: {
    border: "none",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },
  navLabel: {
    fontSize: 11,
    fontWeight: 700,
  },
  guestBanner: {
    background: "#FFF7E8",
    border: `1px solid ${COLORS.warning}`,
    color: COLORS.text,
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 14,
  },
  aiLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    pointerEvents: "none",
  },
  aiPanel: {
    position: "absolute",
    right: 12,
    bottom: 96,
    width: "calc(100% - 24px)",
    maxHeight: "calc(100% - 140px)",
    borderRadius: 26,
    border: "1px solid rgba(255, 255, 255, 0.72)",
    background:
      "linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(239, 249, 246, 0.9))",
    boxShadow:
      "0 24px 54px rgba(15, 23, 42, 0.22), inset 0 1px 0 rgba(255,255,255,0.9)",
    backdropFilter: "blur(20px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    pointerEvents: "auto",
  },
  aiPanelGlow: {
    position: "absolute",
    top: -80,
    right: -70,
    width: 170,
    height: 170,
    borderRadius: 999,
    background:
      "radial-gradient(circle, rgba(47,128,237,0.2), rgba(39,174,96,0.08) 46%, transparent 70%)",
    pointerEvents: "none",
  },
  aiHeader: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "16px 16px 12px 16px",
    borderBottom: "1px solid rgba(229, 231, 235, 0.82)",
  },
  aiTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  aiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 24px rgba(47, 128, 237, 0.26)",
    flexShrink: 0,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.2,
  },
  aiSubtitle: {
    marginTop: 2,
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  aiCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: "rgba(255,255,255,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  aiContextGrid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: "12px 14px",
  },
  aiContextChip: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    border: "1px solid rgba(229, 231, 235, 0.9)",
    background: "rgba(255,255,255,0.72)",
    color: COLORS.text,
    padding: "7px 9px",
    fontSize: 11,
    fontWeight: 700,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  aiPrototypeNotice: {
    position: "relative",
    margin: "0 14px 10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(242, 169, 59, 0.28)",
    background: "rgba(255, 247, 232, 0.82)",
    color: COLORS.text,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1.3,
  },
  aiMessages: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "0 14px 12px 14px",
    overflowY: "auto",
    minHeight: 170,
    maxHeight: 250,
  },
  aiMessageRow: {
    display: "flex",
    width: "100%",
  },
  aiMessageBubble: {
    maxWidth: "86%",
    borderRadius: 18,
    padding: "10px 12px",
    fontSize: 12,
    lineHeight: 1.45,
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  },
  aiAssistantBubble: {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(229, 231, 235, 0.86)",
    color: COLORS.text,
    borderTopLeftRadius: 8,
  },
  aiUserBubble: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #1F9F8A)`,
    color: COLORS.card,
    borderTopRightRadius: 8,
  },
  typingRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    height: 18,
  },
  aiPromptGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: "0 14px 12px 14px",
  },
  aiPromptButton: {
    minHeight: 40,
    borderRadius: 14,
    border: "1px solid rgba(47, 128, 237, 0.18)",
    background: "rgba(238, 245, 255, 0.82)",
    color: COLORS.primary,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1.2,
    padding: "8px 9px",
    textAlign: "left",
  },
  aiSendButton: {
    margin: "0 14px 14px 14px",
    minHeight: 46,
    borderRadius: 16,
    border: "none",
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success})`,
    color: COLORS.card,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 14px 26px rgba(47, 128, 237, 0.25)",
  },
  aiFloatingButton: {
    position: "absolute",
    right: 18,
    bottom: 98,
    minWidth: 70,
    height: 54,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.72)",
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success})`,
    color: COLORS.card,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    pointerEvents: "auto",
    boxShadow:
      "0 18px 34px rgba(47, 128, 237, 0.32), 0 0 0 7px rgba(47, 128, 237, 0.08)",
  },
  aiFloatingText: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0,
  },
  helperText: {
    color: COLORS.subtext,
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: -6,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: 600,
    marginTop: 4,
  },
  successText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: 600,
    marginTop: 4,
  },
};
