import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function UserDropdown() {
  return (
    <div className="flex items-center">
      <SignedOut>
        <SignInButton>
          <button className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8"
            }
          }}
        />
      </SignedIn>
    </div>
  );
} 