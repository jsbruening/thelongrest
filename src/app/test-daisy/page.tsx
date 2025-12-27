"use client";

export default function TestDaisyPage() {
  return (
    <div className="min-h-screen p-8 bg-base-100">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">DaisyUI Test Page</h1>
          <p className="text-lg text-base-content/60">Testing all DaisyUI components and styling</p>
        </div>

        {/* Colors */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Color Palette</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <div className="h-20 bg-primary rounded-lg"></div>
                <span className="text-sm font-medium">Primary</span>
                <span className="text-xs text-base-content/60">#0F172A</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-20 bg-secondary rounded-lg"></div>
                <span className="text-sm font-medium">Secondary</span>
                <span className="text-xs text-base-content/60">#38BDF8</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-20 bg-base-100 rounded-lg border border-base-300"></div>
                <span className="text-sm font-medium">Base 100</span>
                <span className="text-xs text-base-content/60">#F8FAFC</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-20 bg-base-200 rounded-lg border border-base-300"></div>
                <span className="text-sm font-medium">Base 200</span>
                <span className="text-xs text-base-content/60">#FFFFFF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button className="btn btn-accent">Accent</button>
              <button className="btn btn-outline">Outline</button>
              <button className="btn btn-ghost">Ghost</button>
              <button className="btn btn-link">Link</button>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <button className="btn btn-sm btn-primary">Small</button>
              <button className="btn btn-md btn-primary">Medium</button>
              <button className="btn btn-lg btn-primary">Large</button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Card 1</h2>
              <p>This is a basic card with shadow-xl</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary btn-sm">Action</button>
              </div>
            </div>
          </div>
          <div className="card bg-base-200 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">Card 2</h2>
              <p>Card with border and shadow-lg</p>
              <div className="card-actions justify-end">
                <button className="btn btn-secondary btn-sm">Action</button>
              </div>
            </div>
          </div>
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Card 3</h2>
              <p>Card with shadow-md</p>
              <div className="card-actions justify-end">
                <button className="btn btn-accent btn-sm">Action</button>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Dropdown Menu</h2>
            <div className="flex gap-4">
              <div className="dropdown">
                <button type="button" tabIndex={0} className="btn btn-primary m-1">
                  Click me
                </button>
                <ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300">
                  <li><button type="button">Item 1</button></li>
                  <li><button type="button">Item 2</button></li>
                  <li><button type="button">Item 3</button></li>
                </ul>
              </div>
              <div className="dropdown dropdown-end">
                <button type="button" tabIndex={0} className="btn btn-secondary m-1">
                  Dropdown End
                </button>
                <ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300">
                  <li><button type="button">Item 1</button></li>
                  <li><button type="button">Item 2</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Badges</h2>
            <div className="flex flex-wrap gap-4">
              <div className="badge badge-primary">Primary</div>
              <div className="badge badge-secondary">Secondary</div>
              <div className="badge badge-accent">Accent</div>
              <div className="badge badge-outline">Outline</div>
              <div className="badge badge-sm">Small</div>
              <div className="badge badge-md">Medium</div>
              <div className="badge badge-lg">Large</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Alerts</h2>
            <div className="space-y-4">
              <div className="alert alert-info">
                <span>Info alert</span>
              </div>
              <div className="alert alert-success">
                <span>Success alert</span>
              </div>
              <div className="alert alert-warning">
                <span>Warning alert</span>
              </div>
              <div className="alert alert-error">
                <span>Error alert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Form Inputs</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label htmlFor="testTextInput" className="label">
                  <span className="label-text">Text Input</span>
                </label>
                <input id="testTextInput" type="text" placeholder="Type here" className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label htmlFor="testSelect" className="label">
                  <span className="label-text">Select</span>
                </label>
                <select id="testSelect" className="select select-bordered w-full">
                  <option disabled defaultValue="">Pick one</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Checkbox</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Avatar</h2>
            <div className="flex gap-4 items-center">
              <div className="avatar">
                <div className="w-16 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <span className="text-xl font-bold">JD</span>
                </div>
              </div>
              <div className="avatar">
                <div className="w-20 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                  <span className="text-2xl font-bold">AB</span>
                </div>
              </div>
              <div className="avatar">
                <div className="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100 bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center">
                  <span className="text-3xl font-bold">CD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Loading Spinners</h2>
            <div className="flex gap-4 items-center">
              <span className="loading loading-spinner loading-xs"></span>
              <span className="loading loading-spinner loading-sm"></span>
              <span className="loading loading-spinner loading-md"></span>
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Menu</h2>
            <ul className="menu bg-base-100 rounded-box w-56 p-2 border border-base-300">
              <li><button type="button">Home</button></li>
              <li><button type="button">About</button></li>
              <li><button type="button">Contact</button></li>
              <li className="disabled"><button type="button" disabled>Disabled</button></li>
            </ul>
          </div>
        </div>

        {/* Glass Product Test */}
        <div className="card glass-product shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Glass Product Style</h2>
            <p className="text-base-content/80">
              This card uses the glass-product class with backdrop blur and transparency.
            </p>
            <p className="text-sm text-base-content/60 mt-2">
              Background: rgba(255, 255, 255, 0.88) with 12px blur
            </p>
          </div>
        </div>

        {/* Theme Info */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Theme Configuration</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Primary:</strong> #0F172A (Navy 900)</p>
              <p><strong>Secondary:</strong> #38BDF8 (Electric Blue)</p>
              <p><strong>Base 100:</strong> #F8FAFC (Off-White)</p>
              <p><strong>Base 200:</strong> #FFFFFF (White)</p>
              <p><strong>Base 300:</strong> #E2E8F0 (Light Gray)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

