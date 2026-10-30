import { requireCommerce } from "@/lib/surfaces";

/** Courses are a relaunch surface: a 404 until payments are switched on in Settings. */
export default async function CoursesLayout({ children }: { children: React.ReactNode }) {
  await requireCommerce();
  return children;
}
