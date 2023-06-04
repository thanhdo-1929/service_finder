import Item from "./Item";
import { PRODUCTS, RESOURCES, COMPANY, SUPPORT } from "./Menus";
const ItemsContainer = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:px-8 px-5 py-16">
      <Item Links={PRODUCTS} title="Về HolaServiceFinder" />
      <Item Links={RESOURCES} title="Hỗ trợ khách hàng" />
      <Item Links={COMPANY} title="Dịch vụ khác" />
      <Item Links={SUPPORT} title="Đóng góp ý kiến" />
    </div>
  );
};

export default ItemsContainer;