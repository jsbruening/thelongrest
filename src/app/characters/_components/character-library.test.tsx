import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterLibrary } from "./character-library";

const mockMutateCreate = jest.fn();
const mockMutateUpdate = jest.fn();
const mockMutateDelete = jest.fn();
const mockInvalidate = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("~/trpc/react", () => ({
  api: {
    character: {
      getAll: {
        useQuery: jest.fn(),
      },
      create: {
        useMutation: jest.fn(),
      },
      update: {
        useMutation: jest.fn(),
      },
      delete: {
        useMutation: jest.fn(),
      },
    },
    useUtils: () => ({
      character: { getAll: { invalidate: mockInvalidate } },
    }),
  },
}));

const mockCharacters = [
  {
    id: "char-1",
    name: "Aragorn",
    race: "Human",
    class: "Ranger",
    avatarUrl: null,
  },
  {
    id: "char-2",
    name: "Gandalf",
    race: "Wizard",
    class: "Wizard",
    avatarUrl: "https://example.com/avatar.jpg",
  },
];

describe("CharacterLibrary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require("~/trpc/react");
    api.character.getAll.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    api.character.create.useMutation.mockReturnValue({
      mutate: mockMutateCreate,
      isPending: false,
      error: null,
    });
    api.character.update.useMutation.mockReturnValue({
      mutate: mockMutateUpdate,
      isPending: false,
      error: null,
    });
    api.character.delete.useMutation.mockReturnValue({
      mutate: mockMutateDelete,
      isPending: false,
      error: null,
    });
  });

  it("renders header and empty state", () => {
    render(<CharacterLibrary />);

    expect(
      screen.getByRole("heading", { name: /my characters/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no characters yet/i),
    ).toBeInTheDocument();
  });

  it("opens create modal when clicking create button", async () => {
    const user = userEvent.setup();
    render(<CharacterLibrary />);

    await user.click(screen.getAllByRole("button", { name: /create character/i })[0]);

    expect(
      await screen.findByText(/create new character/i),
    ).toBeInTheDocument();
  });

  it("renders character cards when characters exist", () => {
    const { api } = require("~/trpc/react");
    api.character.getAll.useQuery.mockReturnValue({
      data: mockCharacters,
      isLoading: false,
      error: null,
    });

    render(<CharacterLibrary />);

    expect(screen.getByText("Aragorn")).toBeInTheDocument();
    expect(screen.getByText("Gandalf")).toBeInTheDocument();
    expect(screen.getByText(/human ranger/i)).toBeInTheDocument();
    expect(screen.getByText(/wizard wizard/i)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    const { api } = require("~/trpc/react");
    api.character.getAll.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<CharacterLibrary />);

    // The loading spinner might not have role="status", so check for loading spinner class
    const loadingSpinner = document.querySelector('.loading.loading-spinner');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it("displays error message", () => {
    const { api } = require("~/trpc/react");
    api.character.getAll.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Failed to load characters" },
    });

    render(<CharacterLibrary />);

    expect(screen.getByText(/failed to load characters/i)).toBeInTheDocument();
  });

  it("creates character with form data", async () => {
    const user = userEvent.setup();
    render(<CharacterLibrary />);

    await user.click(screen.getAllByRole("button", { name: /create character/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/create new character/i)).toBeInTheDocument();
    });

    // Wait for form to be ready
    const nameInput = screen.getByLabelText(/character name/i);
    await waitFor(() => {
      expect(nameInput).toBeInTheDocument();
    });

    // Use fireEvent to set values directly to avoid timing issues
    fireEvent.change(nameInput, { target: { value: "Legolas" } });
    
    const raceSelect = screen.getByLabelText(/race/i);
    fireEvent.change(raceSelect, { target: { value: "Elf" } });
    
    const classSelect = screen.getByLabelText(/class/i);
    fireEvent.change(classSelect, { target: { value: "Ranger" } });
    
    // Wait for all state updates to complete
    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe("Legolas");
      expect((raceSelect as HTMLSelectElement).value).toBe("Elf");
      expect((classSelect as HTMLSelectElement).value).toBe("Ranger");
    }, { timeout: 2000 });

    // Wait for button to be enabled (form state needs to update)
    // Also verify all form fields have the correct values
    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe("Legolas");
      const raceSelect = screen.getByLabelText(/race/i) as HTMLSelectElement;
      const classSelect = screen.getByLabelText(/class/i) as HTMLSelectElement;
      expect(raceSelect.value).toBe("Elf");
      expect(classSelect.value).toBe("Ranger");
      
      const createButtons = screen.getAllByText("Create");
      const modalCreateButton = createButtons.find(btn => 
        btn.closest('.modal-box') !== null
      );
      expect(modalCreateButton).toBeDefined();
      expect(modalCreateButton).not.toBeDisabled();
    }, { timeout: 5000 });

    // Find and click the Create button in the modal
    const createButtons = screen.getAllByText("Create");
    const modalCreateButton = createButtons.find(btn => 
      btn.closest('.modal-box') !== null
    );
    expect(modalCreateButton).toBeDefined();
    expect(modalCreateButton).not.toBeDisabled();
    if (modalCreateButton) {
      await user.click(modalCreateButton);
    }

    await waitFor(() => {
      expect(mockMutateCreate).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Check the call arguments separately to see what was actually called
    expect(mockMutateCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockMutateCreate.mock.calls[0][0];
    expect(callArgs.name).toBe("Legolas");
    expect(callArgs.race).toBe("Elf");
    expect(callArgs.class).toBe("Ranger");
    expect(callArgs.avatarUrl).toBeUndefined();
  });

  it("opens edit modal and updates character", async () => {
    const user = userEvent.setup();
    const { api } = require("~/trpc/react");
    api.character.getAll.useQuery.mockReturnValue({
      data: mockCharacters,
      isLoading: false,
      error: null,
    });

    render(<CharacterLibrary />);

    // Edit button is an icon button without accessible text, find it by its position in card-actions
    const cards = document.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThan(0);
    const firstCard = cards[0];
    const cardActions = firstCard.querySelector('.card-actions');
    expect(cardActions).toBeInTheDocument();
    if (cardActions) {
      const buttons = cardActions.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      // First button is edit (with SquarePen icon)
      const editButton = buttons[0];
      await user.click(editButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/edit character/i)).toBeInTheDocument();
    });

    // Wait for form to be populated with character data
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/character name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("Aragorn");
    });

    // Wait for form to be populated with character data
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/character name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("Aragorn");
    });

    const nameInput = screen.getByLabelText(/character name/i);
    // Use fireEvent to set value directly
    fireEvent.change(nameInput, { target: { value: "Aragorn Updated" } });
    
    // Wait for the name to be updated in the input
    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe("Aragorn Updated");
    }, { timeout: 2000 });

    // Wait for Save Changes button to be enabled (form state needs to update)
    await waitFor(() => {
      const saveButton = screen.getByText("Save Changes");
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();
    }, { timeout: 3000 });

    // Find and click the Save Changes button
    const saveButton = screen.getByText("Save Changes");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutateUpdate).toHaveBeenCalled();
      // The component uses formData.avatarUrl || null for updates
      // Since the character has avatarUrl: null, formData.avatarUrl will be "" (empty string)
      // So it will send null (empty string || null = null)
      expect(mockMutateUpdate).toHaveBeenCalledWith({
        id: "char-1",
        name: "Aragorn Updated",
        race: "Human",
        class: "Ranger",
        avatarUrl: null, // Empty string || null = null
      });
    }, { timeout: 3000 });
  });

  it("opens delete modal and deletes character", async () => {
    const user = userEvent.setup();
    const { api } = require("~/trpc/react");
    api.character.getAll.useQuery.mockReturnValue({
      data: mockCharacters,
      isLoading: false,
      error: null,
    });

    render(<CharacterLibrary />);

    // Find delete button - it's the second button in card-actions (after edit)
    const cards = document.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThan(0);
    const firstCard = cards[0];
    const cardActions = firstCard.querySelector('.card-actions');
    expect(cardActions).toBeInTheDocument();
    if (cardActions) {
      const buttons = cardActions.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      // Second button is delete (with Trash2 icon)
      const deleteButton = buttons[1];
      await user.click(deleteButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/delete character/i)).toBeInTheDocument();
    });

    // The delete button in the modal should have "Delete" text
    const deleteButtons = screen.getAllByText("Delete");
    const modalDeleteButton = deleteButtons.find(btn => 
      btn.closest('.modal-box') !== null && btn.closest('.modal-box')?.querySelector('h3')?.textContent?.includes('Delete Character')
    );
    expect(modalDeleteButton).toBeDefined();
    if (modalDeleteButton) {
      await user.click(modalDeleteButton);
    }

    await waitFor(() => {
      expect(mockMutateDelete).toHaveBeenCalledWith({ id: "char-1" });
    });
  });

  it("validates required fields before creating", async () => {
    const user = userEvent.setup();
    render(<CharacterLibrary />);

    await user.click(screen.getAllByRole("button", { name: /create character/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/create new character/i)).toBeInTheDocument();
    });

    // Find the create button in the modal - it should be disabled when form is empty
    const modal = document.querySelector('.modal-box');
    expect(modal).toBeInTheDocument();
    if (modal) {
      const buttons = modal.querySelectorAll('button');
      const createButton = Array.from(buttons).find(btn => 
        btn.textContent?.includes('Create') && !btn.textContent?.includes('Cancel')
      );
      expect(createButton).toBeDefined();
      if (createButton) {
        // Button should be disabled when form is empty
        expect(createButton).toHaveAttribute('disabled');
      }
    }
  });
});


