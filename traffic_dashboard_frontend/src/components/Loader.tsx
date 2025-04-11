// Loader.tsx
export default function Loader({ size = 24, color = "#4361ee" }) {
    return (
      <div className="loader-container">
        <svg
          className="loader-spinner"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
          <path
            d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
            opacity=".25"
            fill={color}
          />
          <path
            d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
            fill={color}
            style={{ animation: "spin 1s linear infinite" }}
          />
        </svg>
      </div>
    );
  }
  
  // Alternative simpler Loader (comment out one of them)
  export function DotLoader({ size = 4, color = "#4361ee" }) {
    return (
      <div className="flex items-center justify-center space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`rounded-full bg-[${color}] animate-bounce`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }