/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfilePictureInput } from "./ProfilePicture";

Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(),
});

describe("ProfilePictureInput", () => {
  test("renders the default profile picture icon when no file is provided", () => {
    const { container } = render(<ProfilePictureInput pfpFile={null} />);

    // use queryselector to find the icon because no text is present 
    const icon = container.querySelector(".fi-ss-circle-user");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("fi-ss-circle-user");
  });

  test("renders the uploaded profile picture", () => {
    const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });
    (window.URL.createObjectURL as jest.Mock).mockReturnValue("blob:http://localhost/some-random-uuid");

    render(<ProfilePictureInput pfpFile={file} />);

    const image = screen.getByAltText("profile picture") as HTMLImageElement;
    expect(image.src).toBe("blob:http://localhost/some-random-uuid");
  });

  test("calls onPfpChange when a file is selected", () => {
    const onPfpChange = jest.fn();
    const { container } = render(<ProfilePictureInput pfpFile={null} onPfpChange={onPfpChange} />);

    // same here because the input is hidden
    const input = container.querySelector('#pfp');
    expect(input).toBeInTheDocument();

    const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });

    if (input) {
        fireEvent.change(input, {
          target: {
            files: [file],
          },
        });
    }

    expect(onPfpChange).toHaveBeenCalledTimes(1);
  });

  test("disables the input when readOnly is true", () => {
    const { container } = render(<ProfilePictureInput pfpFile={null} readOnly={true} />);
    const input = container.querySelector('#pfp');
    expect(input).toBeDisabled();
  });
});