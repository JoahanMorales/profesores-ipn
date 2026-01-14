const SearchResultsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-white rounded-lg shadow-md p-6 animate-pulse"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Name skeleton */}
            <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
            
            {/* School skeleton */}
            <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
            
            {/* Career skeleton */}
            <div className="h-4 bg-gray-200 rounded w-56"></div>
          </div>
          
          {/* Stats skeleton */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className="h-8 w-12 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="text-center">
              <div className="h-8 w-12 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ProfileSkeleton = () => (
  <div className="animate-pulse">
    {/* Header */}
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-4">
          <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
      ))}
    </div>

    {/* Reviews */}
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
    
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      
      <div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-32 bg-gray-200 rounded w-full"></div>
      </div>
      
      <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
    </div>
  </div>
);

export { SearchResultsSkeleton, ProfileSkeleton, FormSkeleton };
