import { createElement as h } from "react";

const I = (d, vb = "0 0 24 24") => ({ className: cls = "", size = 20 } = {}) =>
  h("svg", {
    width: size, height: size, viewBox: vb, fill: "none", stroke: "currentColor",
    strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: cls,
  }, ...( Array.isArray(d) ? d : [d]).map(p =>
    typeof p === "string" ? h("path", { d: p }) : h(p.t || "path", p)
  ));

export const Home = I([ "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", { t: "polyline", points: "9 22 9 12 15 12 15 22" } ]);
export const FileText = I([ "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", { t: "polyline", points: "14 2 14 8 20 8" }, "M16 13H8", "M16 17H8", "M10 9H8" ]);
export const Puzzle = I([ "M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 01-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 10-3.214 3.214c.446.166.855.497.925.968a.979.979 0 01-.276.837l-1.61 1.61a2.404 2.404 0 01-1.705.707 2.402 2.402 0 01-1.704-.706l-1.568-1.568a1.026 1.026 0 00-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 11-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 00-.289-.877l-1.568-1.568A2.402 2.402 0 011.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 01.837-.276c.47.07.802.48.968.925a2.501 2.501 0 103.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 01.276-.837l1.61-1.61a2.404 2.404 0 011.705-.707c.618 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 113.237 3.237c-.464.18-.894.527-.967 1.02z" ]);
export const Briefcase = I([ { t: "rect", x: "2", y: "7", width: "20", height: "14", rx: "2", ry: "2" }, "M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" ]);
export const Building2 = I([ "M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z", { t: "line", x1: "6", y1: "12", x2: "18", y2: "12" }, { t: "line", x1: "6", y1: "7", x2: "18", y2: "7" }, "M6 22h12", "M10 22v-4h4v4" ]);
export const Star = I("M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z");
export const BarChart3 = I([ { t: "line", x1: "12", y1: "20", x2: "12", y2: "10" }, { t: "line", x1: "18", y1: "20", x2: "18", y2: "4" }, { t: "line", x1: "6", y1: "20", x2: "6", y2: "16" } ]);
export const HelpCircle = I([ { t: "circle", cx: "12", cy: "12", r: "10" }, "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3", { t: "line", x1: "12", y1: "17", x2: "12.01", y2: "17" } ]);
export const Newspaper = I([ "M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2", { t: "line", x1: "10", y1: "6", x2: "18", y2: "6" }, { t: "line", x1: "10", y1: "10", x2: "18", y2: "10" }, { t: "line", x1: "10", y1: "14", x2: "14", y2: "14" } ]);
export const Layers = I([ { t: "polygon", points: "12 2 2 7 12 12 22 7 12 2" }, "M2 17l10 5 10-5", "M2 12l10 5 10-5" ]);
export const ClipboardList = I([ { t: "rect", x: "8", y: "2", width: "8", height: "4", rx: "1", ry: "1" }, "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2", { t: "line", x1: "12", y1: "11", x2: "16", y2: "11" }, { t: "line", x1: "12", y1: "16", x2: "16", y2: "16" }, { t: "line", x1: "8", y1: "11", x2: "8.01", y2: "11" }, { t: "line", x1: "8", y1: "16", x2: "8.01", y2: "16" } ]);
export const Calendar = I([ { t: "rect", x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }, { t: "line", x1: "16", y1: "2", x2: "16", y2: "6" }, { t: "line", x1: "8", y1: "2", x2: "8", y2: "6" }, { t: "line", x1: "3", y1: "10", x2: "21", y2: "10" } ]);
export const Users = I([ "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", { t: "circle", cx: "9", cy: "7", r: "4" }, "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75" ]);
export const CreditCard = I([ { t: "rect", x: "1", y: "4", width: "22", height: "16", rx: "2", ry: "2" }, { t: "line", x1: "1", y1: "10", x2: "23", y2: "10" } ]);
export const Mail = I([ "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", { t: "polyline", points: "22 6 12 13 2 6" } ]);
export const Settings = I([ { t: "circle", cx: "12", cy: "12", r: "3" }, "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" ]);
export const LogOut = I([ "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", { t: "polyline", points: "16 17 21 12 16 7" }, { t: "line", x1: "21", y1: "12", x2: "9", y2: "12" } ]);
export const ExternalLink = I([ "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6", { t: "polyline", points: "15 3 21 3 21 9" }, { t: "line", x1: "10", y1: "14", x2: "21", y2: "3" } ]);
export const Plus = I([ { t: "line", x1: "12", y1: "5", x2: "12", y2: "19" }, { t: "line", x1: "5", y1: "12", x2: "19", y2: "12" } ]);
export const Pencil = I([ "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" ]);
export const Trash2 = I([ { t: "polyline", points: "3 6 5 6 21 6" }, "M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2", { t: "line", x1: "10", y1: "11", x2: "10", y2: "17" }, { t: "line", x1: "14", y1: "11", x2: "14", y2: "17" } ]);
export const X = I([ { t: "line", x1: "18", y1: "6", x2: "6", y2: "18" }, { t: "line", x1: "6", y1: "6", x2: "18", y2: "18" } ]);
export const Check = I([ { t: "polyline", points: "20 6 9 17 4 12" } ]);
export const ChevronDown = I([ { t: "polyline", points: "6 9 12 15 18 9" } ]);
export const ChevronLeft = I([ { t: "polyline", points: "15 18 9 12 15 6" } ]);
export const ChevronRight = I([ { t: "polyline", points: "9 18 15 12 9 6" } ]);
export const Search = I([ { t: "circle", cx: "11", cy: "11", r: "8" }, { t: "line", x1: "21", y1: "21", x2: "16.65", y2: "16.65" } ]);
export const Eye = I([ "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", { t: "circle", cx: "12", cy: "12", r: "3" } ]);
export const Upload = I([ { t: "polyline", points: "16 16 12 12 8 16" }, { t: "line", x1: "12", y1: "12", x2: "12", y2: "21" }, "M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" ]);
export const Download = I([ "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", { t: "polyline", points: "7 10 12 15 17 10" }, { t: "line", x1: "12", y1: "15", x2: "12", y2: "3" } ]);
export const ArrowUp = I([ { t: "line", x1: "12", y1: "19", x2: "12", y2: "5" }, { t: "polyline", points: "5 12 12 5 19 12" } ]);
export const ArrowDown = I([ { t: "line", x1: "12", y1: "5", x2: "12", y2: "19" }, { t: "polyline", points: "19 12 12 19 5 12" } ]);
export const TrendingUp = I([ { t: "polyline", points: "23 6 13.5 15.5 8.5 10.5 1 18" }, { t: "polyline", points: "17 6 23 6 23 12" } ]);
export const TrendingDown = I([ { t: "polyline", points: "23 18 13.5 8.5 8.5 13.5 1 6" }, { t: "polyline", points: "17 18 23 18 23 12" } ]);
export const Activity = I([ { t: "polyline", points: "22 12 18 12 15 21 9 3 6 12 2 12" } ]);
export const Menu = I([ { t: "line", x1: "3", y1: "12", x2: "21", y2: "12" }, { t: "line", x1: "3", y1: "6", x2: "21", y2: "6" }, { t: "line", x1: "3", y1: "18", x2: "21", y2: "18" } ]);
export const PanelLeftClose = I([ { t: "rect", x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }, { t: "line", x1: "9", y1: "3", x2: "9", y2: "21" }, "M15 9l-3 3 3 3" ]);
export const PanelLeftOpen = I([ { t: "rect", x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }, { t: "line", x1: "9", y1: "3", x2: "9", y2: "21" }, "M14 9l3 3-3 3" ]);
export const Send = I([ { t: "line", x1: "22", y1: "2", x2: "11", y2: "13" }, { t: "polygon", points: "22 2 15 22 11 13 2 9 22 2" } ]);
export const Copy = I([ { t: "rect", x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }, "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" ]);
export const Clock = I([ { t: "circle", cx: "12", cy: "12", r: "10" }, { t: "polyline", points: "12 6 12 12 16 14" } ]);
export const AlertCircle = I([ { t: "circle", cx: "12", cy: "12", r: "10" }, { t: "line", x1: "12", y1: "8", x2: "12", y2: "12" }, { t: "line", x1: "12", y1: "16", x2: "12.01", y2: "16" } ]);
export const FileDown = I([ "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", { t: "polyline", points: "14 2 14 8 20 8" }, { t: "line", x1: "12", y1: "18", x2: "12", y2: "12" }, { t: "polyline", points: "9 15 12 18 15 15" } ]);
export const ArrowLeft = I([ { t: "line", x1: "19", y1: "12", x2: "5", y2: "12" }, { t: "polyline", points: "12 19 5 12 12 5" } ]);
export const Edit3 = I([ "M12 20h9", "M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" ]);
export const File = I([ "M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z", { t: "polyline", points: "13 2 13 9 20 9" } ]);
export const Link2 = I([ "M15 7h3a5 5 0 015 5 5 5 0 01-5 5h-3m-6 0H6a5 5 0 01-5-5 5 5 0 015-5h3", { t: "line", x1: "8", y1: "12", x2: "16", y2: "12" } ]);

const iconMap = {
  Home, FileText, Puzzle, Briefcase, Building2, Star, BarChart3, HelpCircle,
  Newspaper, Layers, ClipboardList, Calendar, Users, CreditCard, Mail,
  Settings, LogOut, ExternalLink, Plus, Pencil, Trash2, X, Check,
  ChevronDown, ChevronLeft, ChevronRight, Search, Eye, Upload, Download,
  ArrowUp, ArrowDown, TrendingUp, TrendingDown, Activity, Menu,
  PanelLeftClose, PanelLeftOpen, Send, Copy, Clock, AlertCircle, FileDown,
  ArrowLeft, Edit3, File, Link2,
};

export function getIcon(name) {
  return iconMap[name] || Home;
}
