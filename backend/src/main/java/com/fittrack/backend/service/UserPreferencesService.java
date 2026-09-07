package com.fittrack.backend.service;

import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPreferencesService {

    private static final int DEFAULT_PLANUNGSHORIZONT_WOCHEN = 2;
    private static final int MIN_PLANUNGSHORIZONT_WOCHEN = 1;
    private static final int MAX_PLANUNGSHORIZONT_WOCHEN = 8;

    private final UserRepository userRepository;

    public UserPreferencesService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public int getPlanungshorizontWochen(String username) {
        return effectiveHorizon(getUser(username));
    }

    /** Liefert den geltenden Planungshorizont (Standardwert, falls der User nichts eingestellt hat). */
    public static int effectiveHorizon(User user) {
        Integer value = user.getPlanungshorizontWochen();
        return value != null ? value : DEFAULT_PLANUNGSHORIZONT_WOCHEN;
    }

    @Transactional
    public int updatePlanungshorizontWochen(Integer wochen, String username) {
        if (wochen == null || wochen < MIN_PLANUNGSHORIZONT_WOCHEN || wochen > MAX_PLANUNGSHORIZONT_WOCHEN) {
            throw new RuntimeException(
                    "Planungshorizont muss zwischen " + MIN_PLANUNGSHORIZONT_WOCHEN + " und "
                            + MAX_PLANUNGSHORIZONT_WOCHEN + " Wochen liegen");
        }

        User user = getUser(username);
        user.setPlanungshorizontWochen(wochen);
        userRepository.save(user);
        return wochen;
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
