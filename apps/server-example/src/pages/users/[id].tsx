import { createHtml } from "@rune-ui/jsx";
import { RunePage } from "@rune-ui/server";

interface UserPageProps {
  user?: {
    id: string;
    name: string;
    email: string;
    joinedAt: string;
  };
  params?: {
    id: string;
  };
}

export default class UserPage extends RunePage<UserPageProps> {
  getMetadata() {
    return {
      title: "User Profile - Rune UI",
      description: "User profile page demonstrating dynamic routing",
    };
  }

  async getServerSideProps(context: any) {
    const { id } = context.params;

    // 실제 앱에서는 데이터베이스에서 가져올 데이터
    const user = {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      joinedAt: new Date().toLocaleDateString(),
    };

    return {
      props: {
        user,
      },
    };
  }

  template() {
    const { user, params } = this.data;

    if (!user) {
      return (
        <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; text-align: center;">
          <h1>User not found</h1>
          <p>User with ID "{params?.id}" was not found.</p>
          <a href="/" style="color: #0070f3; text-decoration: none;">
            ← Back to Home
          </a>
        </div>
      );
    }

    return (
      <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
        <header style="margin-bottom: 2rem;">
          <h1 style="color: #333;">User Profile</h1>
          <nav style="margin-top: 1rem;">
            <a href="/" style="color: #0070f3; text-decoration: none;">
              ← Back to Home
            </a>
          </nav>
        </header>

        <main>
          <div style="background: #f5f5f5; padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
            <h2 style="color: #333; margin-top: 0;">User Information</h2>
            <div style="display: grid; gap: 1rem;">
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Name:</strong> {user.name}
              </div>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Joined:</strong> {user.joinedAt}
              </div>
            </div>
          </div>

          <section>
            <h2 style="color: #333;">Dynamic Routing Demo</h2>
            <p>
              This page demonstrates dynamic routing with the pattern{" "}
              <code>/users/[id]</code>.
            </p>
            <p>Try visiting:</p>
            <ul>
              <li>
                <a href="/users/1" style="color: #0070f3;">
                  User 1
                </a>
              </li>
              <li>
                <a href="/users/42" style="color: #0070f3;">
                  User 42
                </a>
              </li>
              <li>
                <a href="/users/alice" style="color: #0070f3;">
                  User Alice
                </a>
              </li>
            </ul>
          </section>
        </main>
      </div>
    );
  }
}
