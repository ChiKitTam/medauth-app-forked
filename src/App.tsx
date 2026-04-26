import React, { CSSProperties, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Globe,
  History,
  Home,
  Landmark,
  Lock,
  LogOut,
  Pill,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Stethoscope,
  TriangleAlert,
  Upload,
  User,
  Wifi,
  WifiOff,
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
  consumer: { label: "Consumer", icon: User },
  pharmacist: { label: "Pharmacist", icon: Pill },
  healthcare: { label: "Healthcare Professional", icon: Stethoscope },
  regulator: { label: "Regulatory Officer", icon: Landmark },
  admin: { label: "Admin", icon: Settings },
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
type VerificationStatus = "Authentic" | "Suspicious" | "Counterfeit";
type User = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
};
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
  if (role === "regulator" || role === "admin") return "reports";
  return "home";
}

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

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [authMode, setAuthMode] = useState("welcome");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [online, setOnline] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole | "">("");
  const [loginError, setLoginError] = useState("");

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

  const resetAuthMessages = () => {
    setLoginError("");
    setSignupError("");
    setSignupSuccess("");
    setForgotError("");
    setForgotMessage("");
  };

  const handleLogin = () => {
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

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

    setCurrentUser(matchedUser);
    setIsGuest(false);
    setIsLoggedIn(true);
    setScreen(getDashboardScreen(loginRole));
    setAuthMode("welcome");
    setLoginError("");
    localStorage.setItem("medauthSelectedRole", loginRole);
    localStorage.setItem("medauthDashboard", getDashboardScreen(loginRole));
  };

  const handleGuest = () => {
    setCurrentUser({
      name: "Guest User",
      email: "",
      role: "consumer",
    });
    setIsGuest(true);
    setIsLoggedIn(true);
    setScreen("home");
    setAuthMode("welcome");
    setLoginError("");
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
    setAuthMode("welcome");
    setLoginPassword("");
    setLoginRole("");
    localStorage.removeItem("medauthSelectedRole");
    localStorage.removeItem("medauthDashboard");
    resetAuthMessages();
  };

  const handleGuestBackToWelcome = () => {
    setIsLoggedIn(false);
    setIsGuest(false);
    setCurrentUser(null);
    setScreen("home");
    setAuthMode("welcome");
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
            title={getScreenTitle(screen, roleMeta.label)}
            onBack={screen !== "home" ? () => setScreen("home") : undefined}
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
                onLogout={handleLogout}
              />
            )}
          </div>

          <BottomNav navItems={navItems} active={screen} onChange={setScreen} />
        </div>
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
        <div style={styles.appLogoRow}>
          <div className="app-logo-mark" style={styles.appLogoMark}>
            <ShieldCheck size={28} color={COLORS.card} />
          </div>
          <div>
            <div style={styles.appLoginKicker}>Identity Gateway</div>
            <h1 style={styles.appLoginTitle}>MedAuth</h1>
            <p style={styles.appLoginSubtitle}>
              Enterprise medicine verification and compliance access
            </p>
          </div>
        </div>

        <div style={styles.enterpriseStatusRow}>
          <div className="enterprise-status-chip" style={styles.enterpriseStatusChip}>
            <ShieldCheck size={14} color={COLORS.success} />
            <span>Verified access</span>
          </div>
          <div className="enterprise-status-chip" style={styles.enterpriseStatusChip}>
            <Lock size={14} color={COLORS.primary} />
            <span>Secure session</span>
          </div>
        </div>
      </div>

      <div className="app-login-card">
        <Card style={styles.appLoginCard}>
          <div style={styles.loginCardHeader}>
            <div>
              <div style={styles.cardTitle}>Sign in</div>
              <div style={styles.loginCardSubtitle}>
                Access your assigned compliance workspace.
              </div>
            </div>
            <ShieldCheck size={22} color={COLORS.success} />
          </div>

          <div style={styles.inputWrap}>
            <div style={styles.inputLabel}>Select role</div>
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
                    <Icon
                      size={17}
                      color={selected ? COLORS.card : COLORS.primary}
                    />
                    <span>{meta.label}</span>
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
              label="Continue to Dashboard"
              onClick={onLogin}
              icon={Lock}
            />
          </div>

          <button
            type="button"
            className="guest-access-button"
            style={styles.guestAccessButton}
            onClick={onGuest}
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
    <div style={styles.phoneOuter}>
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

  const features = [
    "Secure login and role-based access",
    "Barcode scanning and manual code entry",
    "Authentic, suspicious, or counterfeit results",
    "Offline verification and data synchronization",
    currentRole === "admin"
      ? "Administrator account management"
      : "Incident reporting and compliance dashboards",
  ];

  return (
    <div style={styles.stackGapLg}>
      <Card>
        <div style={styles.heroHeader}>
          <div>
            <div style={styles.welcomeText}>Welcome</div>
            <div style={styles.heroName}>
              WissenMedAuth {isGuest ? "Guest" : roleMeta.label}
            </div>
          </div>
          <div style={styles.rolePill}>
            <RoleIcon size={16} color={COLORS.primary} />
            <span>{isGuest ? "Guest" : roleMeta.label}</span>
          </div>
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

      <div style={styles.quickGrid}>
        <QuickAction
          icon={Camera}
          label="Scan"
          onClick={() => onNavigate("scan")}
        />
        {!isGuest && (
          <QuickAction
            icon={History}
            label="History"
            onClick={() => onNavigate("history")}
          />
        )}
        {!isGuest && (
          <QuickAction
            icon={Bell}
            label="Alerts"
            onClick={() => onNavigate("alerts")}
          />
        )}
        {!isGuest ? (
          <QuickAction
            icon={FileText}
            label="Reports"
            onClick={() => onNavigate("reports")}
          />
        ) : (
          <QuickAction
            icon={Settings}
            label="Settings"
            onClick={() => onNavigate("settings")}
          />
        )}
      </div>

      <Card>
        <div style={styles.cardTitle}>Core Features</div>
        <div style={styles.featureList}>
          {features.map((item) => (
            <div key={item} style={styles.featureRow}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {isGuest && (
        <SecondaryButton label="Back" onClick={onGuestBack} icon={ArrowLeft} />
      )}
    </div>
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

function SettingsScreen({ roleLabel, name, email, isGuest, onLogout }: any) {
  return (
    <div style={styles.stackGapLg}>
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
        <SettingRow icon={Lock} label="Privacy and Security" />
        <SettingRow icon={Globe} label="Language Preferences" />
        <SettingRow icon={ShieldCheck} label="Verification Preferences" />
      </Card>

      {!isGuest && (
        <SecondaryButton label="Log Out" onClick={onLogout} icon={LogOut} />
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

function PrimaryButton({ label, onClick, disabled = false, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles.primaryBtn, opacity: disabled ? 0.7 : 1 }}
    >
      {Icon ? <Icon size={16} color={COLORS.card} /> : null}
      <span>{label}</span>
    </button>
  );
}

function SecondaryButton({ label, onClick, icon: Icon }: any) {
  return (
    <button onClick={onClick} style={styles.secondaryBtn}>
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
      <div style={styles.inputBox}>
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
      <div style={styles.inputBox}>
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

function SettingRow({ icon: Icon, label }: any) {
  return (
    <div style={styles.settingRow}>
      <div style={styles.settingLeft}>
        <Icon size={16} color={COLORS.primary} />
        <span>{label}</span>
      </div>
      <ArrowLeft
        size={14}
        color={COLORS.subtext}
        style={{ transform: "rotate(180deg)" }}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  appShell: {
    minHeight: "100vh",
    background: `linear-gradient(180deg, ${COLORS.bg} 0%, #EAF1FB 100%)`,
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
    padding: "28px 18px 18px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    background:
      "linear-gradient(180deg, #F8FBFD 0%, #F3F7FA 48%, #EEF4F8 100%)",
  },
  appLoginTop: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
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
    fontSize: 30,
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
  enterpriseStatusRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  enterpriseStatusChip: {
    minHeight: 40,
    borderRadius: 14,
    border: "1px solid rgba(47, 128, 237, 0.12)",
    background: "rgba(255,255,255,0.84)",
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
    border: "1px solid rgba(214, 224, 230, 0.92)",
    boxShadow: "0 18px 42px rgba(15, 23, 42, 0.1)",
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
  roleOptionList: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
  },
  roleOptionButton: {
    minHeight: 46,
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
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
  },
  roleOptionButtonActive: {
    background: COLORS.primary,
    borderColor: COLORS.primary,
    color: COLORS.card,
    boxShadow: "0 10px 18px rgba(47, 128, 237, 0.22)",
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
    borderRadius: 22,
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
    padding: "8px 10px",
    fontSize: 12,
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  settingLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 600,
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
