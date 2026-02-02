import * as bcrypt from "bcryptjs";
import { User } from "./user.model";
import { signAccess, signRefresh } from "../../utils/jwt";
import { formatWallet } from "../../utils/wallet";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface SafeUser {
  _id: any;
  username: string;
  points: number;
  wallet?: any;
}

function toSafeUser(u: any): SafeUser {
  return { _id: u._id, username: u.username, points: u.points, wallet: formatWallet(u.wallet) };
}

export async function registerUser(input: { username: string; email?: string; password: string }) {
  const usernameLower = input.username;
  const emailLower = input.email ? input.email.toLowerCase() : undefined;

  // Ensure uniqueness
  const exists = await User.findOne({
    $or: [
      { username: usernameLower },
      ...(emailLower ? [{ email: emailLower }] : []),
    ],
  }).lean();
  if (exists) {
    if (exists.username === usernameLower) throw new Error("USERNAME_TAKEN");
    if (emailLower && exists.email && exists.email.toLowerCase() === emailLower) throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await User.create({
    username: input.username,
    email: input.email,
    passwordHash,
    points: 1000,
  });

  const access = signAccess({ _id: user._id, username: user.username });
  const refresh = signRefresh({ _id: user._id });
  return { user: toSafeUser(user), tokens: { access, refresh } as AuthTokens };
}

export async function authenticateUser(input: { username?: string; email?: string; identifier?: string; password: string }) {
  const id = input.identifier?.trim();
  const uname = input.username?.trim();
  const mail = input.email?.trim();

  const ors: any[] = [];
  if (uname) ors.push({ username: uname });
  if (mail) ors.push({ email: mail.toLowerCase() });
  if (id) {
    if (id.includes("@")) ors.push({ email: id.toLowerCase() });
    else ors.push({ username: id });
  }
  if (!ors.length) throw new Error("INVALID_DATA");

  const user = await User.findOne({ $or: ors }).select("+passwordHash +username +email +points +wallet").lean();
  if (!user || !user.passwordHash) throw new Error("INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  const access = signAccess({ _id: user._id, username: user.username });
  const refresh = signRefresh({ _id: user._id });
  return { user: toSafeUser(user), tokens: { access, refresh } as AuthTokens };
}

export async function getUserById(id: any) {
  const user = await User.findById(id).select("_id username points wallet").lean();
  return user ? toSafeUser(user) : null;
}
