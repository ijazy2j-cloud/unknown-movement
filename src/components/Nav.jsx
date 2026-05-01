export default function Nav({ back, title, onBack, onSubmit }) {
  return (
    <div className="um-nav">
      {back ? (
        <button className="um-nav-back" onClick={onBack}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          <span>{title || 'Back'}</span>
        </button>
      ) : (
        <div className="um-logo">Unknown Movement</div>
      )}
      <div className="um-nav-right">
        {back ? (
          <>
            <button className="um-nav-link">Share</button>
            <button className="um-nav-link">···</button>
          </>
        ) : (
          <>
            <span className="um-nav-link">Explore</span>
            <button className="um-nav-cta" onClick={onSubmit}>Submit</button>
          </>
        )}
      </div>
    </div>
  );
}
