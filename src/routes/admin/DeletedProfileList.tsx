import type { ReactNode } from "react"

export function DeletedProfileList<T extends { docID: string }>({
    profiles, loading, handleRestore, ProfileCard
}: {
    profiles: T[],
    loading: boolean,
    handleRestore: (profile: T) => void,
    ProfileCard: (props: { onRestore: (profile: T) => void, profile: T }) => ReactNode
}) {

    return (
        <div className="bg-primary p-4 rounded-xl shadow-lg">
            <div className="flex flex-col gap-4">
                {loading ? (
                    // display loading while fetching from database.
                    <div className="text-center text-white py-8">Fetching...</div>
                ) : profiles.length === 0 ? (
                    <div className="text-center text-white py-8">No profiles to show.</div>
                ) : (
                    // non-empty profiles
                    profiles.map((profile, index) => (

                        <ProfileCard
                            key={`${index}${profile.docID}`}
                            onRestore={handleRestore}
                            profile={profile}
                        />
                    ))
                )}
            </div>
        </div>
    )
}