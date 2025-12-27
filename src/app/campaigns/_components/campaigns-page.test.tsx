import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { CampaignsPage } from "./campaigns-page";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("~/trpc/react", () => ({
  api: {
    campaign: {
      getAll: {
        useQuery: jest.fn(),
      },
    },
  },
}));

const mockRouter = {
  push: jest.fn(),
};

const mockCampaigns = [
  {
    id: "1",
    name: "Test Campaign",
    dmId: "user1",
    description: "A test campaign",
    dm: {
      id: "user1",
      name: "DM User",
      email: "dm@example.com",
      displayName: null,
    },
    _count: {
      campaignCharacters: 3,
      sessions: 5,
    },
  },
  {
    id: "2",
    name: "Another Campaign",
    dmId: "user2",
    description: null,
    dm: {
      id: "user2",
      name: null,
      email: "dm2@example.com",
      displayName: "DM Two",
    },
    _count: {
      campaignCharacters: 1,
      sessions: 2,
    },
  },
];

describe("CampaignsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: "user1" } },
      status: "authenticated",
    });
  });

  it("renders header and new campaign button", () => {
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
    });

    render(<CampaignsPage />);

    // Use getAllByRole since there are multiple headings with "Campaigns" text
    const headings = screen.getAllByRole("heading", { name: /campaigns/i });
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getByText(/manage your d&d campaigns/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new campaign/i })).toBeInTheDocument();
  });

  it("navigates to new campaign page when button is clicked", async () => {
    const user = userEvent.setup();
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
    });

    render(<CampaignsPage />);

    await user.click(screen.getByRole("button", { name: /new campaign/i }));

    expect(mockRouter.push).toHaveBeenCalledWith("/campaigns/new");
  });

  it("shows loading state", () => {
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    });

    render(<CampaignsPage />);

    // Check for loading spinner (may be in loading cards)
    const loadingElements = document.querySelectorAll('.loading');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("shows empty state when no campaigns", () => {
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
    });

    render(<CampaignsPage />);

    expect(screen.getByText(/no campaigns yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first campaign/i)).toBeInTheDocument();
  });

  it("renders campaign cards with correct data", () => {
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: mockCampaigns,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(<CampaignsPage />);

    expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByText("Another Campaign")).toBeInTheDocument();
    expect(screen.getByText(/3/i)).toBeInTheDocument(); // character count
    expect(screen.getByText(/5/i)).toBeInTheDocument(); // session count
  });

  it("shows DM badge for campaigns where user is DM", () => {
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: mockCampaigns,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(<CampaignsPage />);

    const dmBadges = screen.getAllByText("DM");
    expect(dmBadges.length).toBe(1); // Only first campaign has user as DM
  });

  it("displays error message on error", () => {
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Failed to load" },
      isError: true,
    });

    render(<CampaignsPage />);

    expect(screen.getByText(/error loading campaigns/i)).toBeInTheDocument();
  });

  it("shows unauthorized message for unauthorized error", () => {
    (api.campaign.getAll.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { data: { code: "UNAUTHORIZED" } },
      isError: true,
    });

    render(<CampaignsPage />);

    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });
});

