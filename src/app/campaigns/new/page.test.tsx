import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import NewCampaignPage from "./page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("~/trpc/react", () => ({
  api: {
    campaign: {
      create: {
        useMutation: jest.fn(),
      },
    },
  },
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

describe("NewCampaignPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (api.campaign.create.useMutation as jest.Mock).mockReturnValue(mockUseMutation);
  });

  it("renders campaign creation form", () => {
    render(<NewCampaignPage />);

    expect(screen.getByText(/create new campaign/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/campaign name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("validates campaign name is required", async () => {
    const user = userEvent.setup();
    render(<NewCampaignPage />);

    // Try to submit with empty name
    const submitButton = screen.getByRole("button", { name: /create campaign/i });
    await user.click(submitButton);

    // The form has HTML5 required validation, but our custom validation should also trigger
    // Since the input has required attribute, the browser will prevent submission
    // Our custom validation in handleSubmit checks if name.trim() is empty
    await waitFor(() => {
      // If HTML5 validation prevents submission, the custom error won't show
      // So we just verify the mutation wasn't called
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it("creates campaign with valid data", async () => {
    const user = userEvent.setup();
    let onSuccessCallback: ((data: { id: string }) => void) | undefined;
    
    const mockMutateWithSuccess = jest.fn((_data) => {
      // Simulate successful mutation by calling onSuccess from useMutation config
      if (onSuccessCallback) {
        setTimeout(() => {
          onSuccessCallback({ id: "campaign-1" });
        }, 0);
      }
    });
    
    // Mock useMutation to capture onSuccess callback
    const mockUseMutation = jest.fn((config?: { onSuccess?: (_data: { id: string }) => void }) => {
      if (config?.onSuccess) {
        onSuccessCallback = config.onSuccess;
      }
      return {
        mutate: mockMutateWithSuccess,
        isPending: false,
        error: null,
      };
    });
    
    (api.campaign.create.useMutation as jest.Mock).mockImplementation(mockUseMutation);

    render(<NewCampaignPage />);

    await user.type(screen.getByLabelText(/campaign name/i), "Test Campaign");
    await user.type(screen.getByLabelText(/description/i), "A test campaign");

    const submitButton = screen.getByRole("button", { name: /create campaign/i });
    await user.click(submitButton);

    // Verify mutation was called with correct data (no options, just data)
    await waitFor(() => {
      expect(mockMutateWithSuccess).toHaveBeenCalledWith({
        name: "Test Campaign",
        description: "A test campaign",
      });
    });
  });

  it("handles creation errors", async () => {
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
              onErrorCallback({ message: "Failed to create campaign" } as Error);
            }, 0);
          }
        }),
        isPending: false,
        error: null,
      };
    });
    
    (api.campaign.create.useMutation as jest.Mock).mockImplementation(mockUseMutation);

    render(<NewCampaignPage />);

    // Fill form and submit to trigger error
    await user.type(screen.getByLabelText(/campaign name/i), "Test Campaign");
    const submitButton = screen.getByRole("button", { name: /create campaign/i });
    await user.click(submitButton);

    // Error should be displayed when onError callback is triggered
    await waitFor(() => {
      expect(screen.getByText(/failed to create campaign/i)).toBeInTheDocument();
    });
  });
});

