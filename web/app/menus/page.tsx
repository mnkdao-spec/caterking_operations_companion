"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { MenuItemForm } from "@/components/menu-item-form";
import {
  Plus,
  Search,
  UtensilsCrossed,
  DollarSign,
  Users,
  Leaf,
  Wheat,
  Edit,
  Copy,
  Trash2,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  cost: number;
  price: number;
  servings: number;
  dietaryTags: string[];
}

const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Grilled Salmon with Herb Butter",
    category: "Main Course",
    description: "Fresh Atlantic salmon with lemon herb butter, roasted vegetables",
    cost: 12.50,
    price: 28.00,
    servings: 1,
    dietaryTags: ["Gluten-Free"],
  },
  {
    id: "2",
    name: "Vegetarian Lasagna",
    category: "Main Course",
    description: "Layers of pasta, ricotta, spinach, and marinara sauce",
    cost: 8.00,
    price: 18.00,
    servings: 1,
    dietaryTags: ["Vegetarian"],
  },
  {
    id: "3",
    name: "Caesar Salad",
    category: "Appetizer",
    description: "Romaine lettuce, parmesan, croutons, Caesar dressing",
    cost: 3.50,
    price: 8.00,
    servings: 1,
    dietaryTags: [],
  },
  {
    id: "4",
    name: "Chocolate Lava Cake",
    category: "Dessert",
    description: "Warm chocolate cake with molten center, vanilla ice cream",
    cost: 4.00,
    price: 10.00,
    servings: 1,
    dietaryTags: ["Vegetarian"],
  },
  {
    id: "5",
    name: "Quinoa Buddha Bowl",
    category: "Main Course",
    description: "Quinoa, roasted vegetables, chickpeas, tahini dressing",
    cost: 7.00,
    price: 16.00,
    servings: 1,
    dietaryTags: ["Vegan", "Gluten-Free"],
  },
];

const CATEGORIES = ["All", "Appetizer", "Main Course", "Side Dish", "Dessert", "Beverage"];

const DIETARY_ICONS: Record<string, JSX.Element> = {
  "Vegetarian": <Leaf className="h-4 w-4 text-green-600" />,
  "Vegan": <Leaf className="h-4 w-4 text-green-700" />,
  "Gluten-Free": <Wheat className="h-4 w-4 text-amber-600" />,
};

export default function MenusPage() {
  const [menuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleFormSuccess = () => {
    // Reload menu items - for now just close the form
    // TODO: Implement actual data reload from Supabase
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateMargin = (cost: number, price: number) => {
    return ((price - cost) / price * 100).toFixed(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Builder</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage your catering menu items and recipes
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
            <Plus className="h-5 w-5 mr-2" />
            New Menu Item
          </button>
        </div>

        {/* Search and Category Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="h-5 w-5 text-amber-600" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Dietary Tags */}
                {item.dietaryTags.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {item.dietaryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
                      >
                        {DIETARY_ICONS[tag]}
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Pricing Info */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${item.cost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        {calculateMargin(item.cost, item.price)}% margin
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{item.servings} serving</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 pt-3 mt-3 flex gap-2">
                  <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center text-gray-500">
              <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No menu items found
              </h3>
              <p className="text-sm">
                Try adjusting your search or create a new menu item.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Menu Item Form Modal */}
      <MenuItemForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleFormSuccess}
        menuItem={editingItem}
      />
    </div>
  );
}
