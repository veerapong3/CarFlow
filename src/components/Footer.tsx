import Link from "next/link";
import { Bus, Globe, Mail, MapPin, Phone } from "lucide-react";

const YEAR = new Date().getFullYear();

const LINKS = [
  { href: "/", label: "จองรถ" },
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/vehicles", label: "จัดการรถ" },
  { href: "/admin/bookings", label: "การจอง" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-school-green text-white">
              <Bus className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">CarFlow</p>
              <p className="text-xs text-slate-500">ระบบจองรถโรงเรียน</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            โรงเรียนดอนตาลวิทยา
            <br />
            สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามุกดาหาร
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">ติดต่อโรงเรียน</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-school-green" />
              <span>
                455 หมู่ที่ 7 ตำบลดอนตาล
                <br />
                อำเภอดอนตาล จังหวัดมุกดาหาร 49120
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-school-green" />
              <a href="tel:042689088" className="hover:text-primary-700">
                042-689-088
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-school-green" />
              <a
                href="mailto:dontanwit@gmail.com"
                className="hover:text-primary-700"
              >
                dontanwit@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-school-green" />
              <a
                href="https://www.dontanwit.ac.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-700"
              >
                www.dontanwit.ac.th
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">เมนู</p>
          <ul className="space-y-2 text-sm">
            {LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-slate-600 hover:text-primary-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>
            © {YEAR} โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร · CarFlow v1.0
          </p>
          <p>
            Developed by{" "}
            <span className="font-medium text-slate-700">Dev.V.tak</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
