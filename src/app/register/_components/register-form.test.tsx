import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { RegisterForm } from "./register-form";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("~/trpc/react", () => ({
  api: {
    user: {
      register: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockMutate = jest.fn();
const mockUseMutation = {
  mutate: mockMutate,
  isPending: false,
  error: null,
};

describe("RegisterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (api.user.register.useMutation as jest.Mock).mockReturnValue(mockUseMutation);
  });

  it("renders registration form with all fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("validates password length", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });
    });
  });

  it("submits form without name (optional field)", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        name: undefined,
      });
    });
  });

  it("displays error message from mutation", async () => {
    const user = userEvent.setup();
    let onErrorCallback: ((err: Error) => void) | undefined;
    
    // Mock useMutation to capture the onError callback from the config
    const mockUseMutation = jest.fn((config?: { onError?: (err: Error) => void }) => {
      if (config?.onError) {
        onErrorCallback = config.onError;
      }
      return {
        mutate: jest.fn((_data) => {
          // Simulate error by calling onError
          if (onErrorCallback) {
            setTimeout(() => {
              onErrorCallback({ message: "Email already exists" } as Error);
            }, 0);
          }
        }),
        isPending: false,
        error: null,
      };
    });
    
    (api.user.register.useMutation as jest.Mock).mockImplementation(mockUseMutation);

    render(<RegisterForm />);

    // Fill form and submit to trigger error
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Error should be displayed when onError callback is triggered
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it("shows loading state during registration", () => {
    const pendingMutation = {
      ...mockUseMutation,
      isPending: true,
    };
    (api.user.register.useMutation as jest.Mock).mockReturnValue(pendingMutation);

    render(<RegisterForm />);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
  });

  it("has link to login page", () => {
    render(<RegisterForm />);

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });
});

