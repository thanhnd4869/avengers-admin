import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faArrowRotateRight,
  faBoxOpen,
  faCartShopping,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faComments,
  faCreditCard,
  faEnvelope,
  faEye,
  faEyeSlash,
  faGamepad,
  faGauge,
  faImages,
  faKey,
  faMagnifyingGlass,
  faMoneyBillWave,
  faNewspaper,
  faPen,
  faPlus,
  faReceipt,
  faRightFromBracket,
  faRotateLeft,
  faTrashCan,
  faTriangleExclamation,
  faUser,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

// One icon set (Font Awesome Solid, as in avengers-shop), named by meaning so
// pages never pick glyphs of their own.
const ICONS = {
  overview: faGauge,
  orders: faReceipt,
  payments: faCreditCard,
  products: faGamepad,
  users: faUsers,
  user: faUser,
  messages: faEnvelope,
  banners: faImages,
  posts: faNewspaper,
  comments: faComments,
  revenue: faMoneyBillWave,
  cart: faCartShopping,
  pending: faClock,
  stock: faBoxOpen,
  key: faKey,
  refund: faRotateLeft,
  refresh: faArrowRotateRight,
  search: faMagnifyingGlass,
  add: faPlus,
  edit: faPen,
  delete: faTrashCan,
  close: faXmark,
  check: faCheck,
  success: faCircleCheck,
  warning: faTriangleExclamation,
  error: faCircleExclamation,
  visible: faEye,
  hidden: faEyeSlash,
  back: faArrowLeft,
  forward: faArrowRight,
  previous: faChevronLeft,
  next: faChevronRight,
  logout: faRightFromBracket,
};

export default function Icon({ name, size = 14, className = "", title }) {
  const icon = ICONS[name];

  if (!icon) return null;

  return (
    <FontAwesomeIcon
      icon={icon}
      className={`icon ${className}`.trim()}
      title={title}
      aria-hidden={title ? undefined : true}
      style={{ width: size, height: size }}
    />
  );
}
