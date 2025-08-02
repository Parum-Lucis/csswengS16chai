/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeletedProfileList } from "../admin/DeletedProfileList";

describe("Deleted Profile List", () => {
  const mockProfiles = [
    { docID: "p1", name: "John Doe" },
    { docID: "p2", name: "Jane Smith" },
  ];

  const mockHandleRestore = jest.fn();

  const MockProfileCard = ({
    onRestore,
    profile,
  }: {
    onRestore: (profile: any) => void;
    profile: any;
  }) => (
    <div data-testid={`profile-${profile.docID}`}>
      <span>{profile.name}</span>
      <button onClick={() => onRestore(profile)}>Restore</button>
    </div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays 'Fetching...' when loading is true", () => {
    render(
      <DeletedProfileList
        profiles={[]}
        loading={true}
        handleRestore={mockHandleRestore}
        ProfileCard={MockProfileCard}
      />
    );

    expect(screen.getByText("Fetching...")).toBeInTheDocument();
  });

  it("displays 'Nothing to show.' when profiles list is empty", () => {
    render(
      <DeletedProfileList
        profiles={[]}
        loading={false}
        handleRestore={mockHandleRestore}
        ProfileCard={MockProfileCard}
      />
    );

    expect(screen.getByText("Nothing to show.")).toBeInTheDocument();
  });

  it("renders ProfileCard for each profile and triggers handleRestore", () => {
    render(
      <DeletedProfileList
        profiles={mockProfiles}
        loading={false}
        handleRestore={mockHandleRestore}
        ProfileCard={MockProfileCard}
      />
    );

    mockProfiles.forEach((p) => {
      expect(screen.getByTestId(`profile-${p.docID}`)).toBeInTheDocument();
      expect(screen.getByText(p.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Restore")[0]);
    expect(mockHandleRestore).toHaveBeenCalledWith(mockProfiles[0]);
  });
});
